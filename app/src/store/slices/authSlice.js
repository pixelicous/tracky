import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, firestore } from "../../services/api/firebase";

// Async thunks for authentication
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update profile with display name
      await firebaseUpdateProfile(user, { displayName });

      // Create user document in Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: null,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        subscription: {
          tier: "free",
          expiryDate: null,
          platform: null,
        },
        preferences: {
          theme: "default",
          notifications: true,
          reminderTime: "20:00",
        },
        stats: {
          totalHabitsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          xpPoints: 0,
          level: 1,
        },
        inventory: {
          avatars: ["default"],
          themes: ["default"],
          boosters: [],
        },
        friends: [],
      });

      // Return user data
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update last active timestamp
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        lastActive: serverTimestamp(),
      });

      // Get user data from Firestore
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          ...userDoc.data(),
        };
      } else {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        };
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut(auth);
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (email, { rejectWithValue }) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;
      const userDocRef = doc(firestore, "users", uid);

      await updateDoc(userDocRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });

      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register user
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Sign in
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Sign out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = {
          ...state.user,
          ...action.payload,
        };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;

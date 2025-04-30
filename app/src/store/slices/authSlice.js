import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../services/api/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

      // Wait for the user to be fully authenticated
      await user.getIdToken(true);

      // Update profile with display name
      await firebaseUpdateProfile(user, { displayName });
      // Create user document in Firestore
      const userDocRef = doc(db, "users", user.uid);
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

      console.log("User document created");

      // Return user data
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
    } catch (error) {
      console.error("Error creating user document:", error);
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
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        lastActive: serverTimestamp(),
      });

      // Get user data from Firestore
      const userDoc = await getDoc(userDocRef);

      let userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };

      if (userDoc.exists()) {
        const data = userDoc.data();
        userData = {
          ...userData,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString() || null,
          lastActive: data.lastActive?.toDate().toISOString() || null,
          updatedAt: data.updatedAt?.toDate().toISOString() || null,
        };
      }

      return userData;
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

      if (!uid) {
        console.error("User UID is undefined");
        return rejectWithValue("User UID is undefined");
      }

      console.log("Updating profile for user:", uid);
      console.log("Update data:", userData);

      const userDocRef = doc(db, "users", uid);

      // Create update object with only defined fields
      const updateData = {
        updatedAt: serverTimestamp(),
      };

      if (userData.displayName !== undefined)
        updateData.displayName = userData.displayName;
      if (userData.bio !== undefined) updateData.bio = userData.bio;
      if (userData.photoURL !== undefined)
        updateData.photoURL = userData.photoURL;
      if (userData.preferences !== undefined)
        updateData.preferences = userData.preferences;
      if (userData.stats !== undefined) updateData.stats = userData.stats;

      console.log("Update object:", updateData);

      await updateDoc(userDocRef, updateData);
      console.log("Profile updated successfully");

      // Return the complete user data to ensure state is properly updated
      return {
        ...getState().auth.user,
        ...userData,
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  "auth/loadUserFromStorage",
  async (_, { rejectWithValue }) => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        return {
          ...parsedUserData,
          bio: parsedUserData.bio || "", // Ensure bio is always present
        };
      } else {
        return null;
      }
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
      state.isAuthenticated = action.payload !== null;

      // Persist user state to AsyncStorage when it changes
      if (action.payload) {
        AsyncStorage.setItem("user", JSON.stringify(action.payload));
      } else {
        AsyncStorage.removeItem("user");
      }
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
        const payload = {
          ...action.payload,
          createdAt:
            action.payload.createdAt?.toDate?.()?.toISOString() || null,
          lastActive:
            action.payload.lastActive?.toDate?.()?.toISOString() || null,
          updatedAt:
            action.payload.updatedAt?.toDate?.()?.toISOString() || null,
        };
        state.user = payload;
        state.isAuthenticated = true;

        // Save user data to AsyncStorage for session persistence
        AsyncStorage.setItem("user", JSON.stringify(payload));
        console.log("User session saved to AsyncStorage after registration");
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
        const payload = {
          ...action.payload,
          createdAt: action.payload.createdAt?.toDate().toISOString() || null,
          lastActive: action.payload.lastActive?.toDate().toISOString() || null,
          updatedAt: action.payload.updatedAt?.toDate().toISOString() || null,
        };
        state.user = payload;
        state.isAuthenticated = true;
        // Fetch latest user data from Firestore and update AsyncStorage
        (async () => {
          const userDocRef = doc(db, "users", payload.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            const updatedUserData = {
              ...payload,
              ...data,
              createdAt: data.createdAt?.toDate().toISOString() || null,
              lastActive: data.lastActive?.toDate().toISOString() || null,
              updatedAt: data.updatedAt?.toDate().toISOString() || null,
            };
            state.user = updatedUserData;
            AsyncStorage.setItem("user", JSON.stringify(updatedUserData));
          } else {
            AsyncStorage.setItem("user", JSON.stringify(payload));
          }
        })();
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
        AsyncStorage.removeItem("user");
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
        // Use the complete user object returned from the thunk
        const updatedUser = action.payload;
        state.user = updatedUser;
        AsyncStorage.setItem("user", JSON.stringify(updatedUser)); // Update AsyncStorage
        console.log(
          "updateUserProfile.fulfilled: Redux store updated",
          updatedUser
        ); // Add logging
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Load user from storage
      .addCase(loadUserFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = action.payload !== null;
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

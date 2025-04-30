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

      // Create a serializable user object with basic auth properties
      let userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || null,
        emailVerified: user.emailVerified || false,
        phoneNumber: user.phoneNumber || null,
      };

      if (userDoc.exists()) {
        const data = userDoc.data();
        userData = {
          ...userData,
          ...data,
          // Ensure timestamps are serialized
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          lastActive: data.lastActive?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
          // Remove any potential non-serializable fields
          proactiveRefresh: undefined,
          reloadUserInfo: undefined,
          reloadListener: undefined,
          stsTokenManager: undefined,
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
      const userDocRef = doc(db, "users", uid);

      await updateDoc(userDocRef, {
        displayName: userData.displayName || "",
        bio: userData.bio || "",
        photoURL: userData.photoURL || null,
        preferences: userData.preferences || {},
        updatedAt: serverTimestamp(),
      });

      return userData;
    } catch (error) {
      console.error("Error updating profile:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  "auth/loadUserFromStorage",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUserData = JSON.parse(userData);

        // After loading from storage, fetch fresh data if we have a user ID
        if (parsedUserData && parsedUserData.uid) {
          // We'll dispatch fetchUserData after returning the stored data
          // This ensures the app loads quickly with cached data first
          setTimeout(() => {
            dispatch(fetchUserData());
          }, 0);
        }

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

// Fetch fresh user data from Firestore
export const fetchUserData = createAsyncThunk(
  "auth/fetchUserData",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().auth;

      if (!user || !user.uid) {
        console.log("No user ID found, skipping fetchUserData");
        return rejectWithValue("No user ID found");
      }

      const uid = user.uid;
      console.log("Fetching fresh user data from Firestore for uid:", uid);

      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error("User document not found for uid:", uid);
        return rejectWithValue("User document not found");
      }

      const data = userDoc.data();
      console.log("User document data:", data);

      // Create a new user object with only serializable properties
      const userData = {
        uid: uid,
        email: user.email,
        displayName: user.displayName || data?.displayName || "",
        photoURL: user.photoURL || data?.photoURL || null,
        emailVerified: user.emailVerified || false,
        phoneNumber: user.phoneNumber || null,
        // Add Firestore data
        ...data,
        // Ensure timestamps are serialized
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        lastActive: data.lastActive?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        // Remove any potential non-serializable fields from Firestore
        proactiveRefresh: undefined,
        reloadUserInfo: undefined,
        reloadListener: undefined,
        stsTokenManager: undefined,
      };

      console.log("Fresh user data fetched successfully");

      // Update AsyncStorage with fresh data
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
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
          createdAt: action.payload.createdAt || null,
          lastActive: action.payload.lastActive || null,
          updatedAt: action.payload.updatedAt || null,
        };
        state.user = payload;
        state.isAuthenticated = true;

        // Save user data to AsyncStorage
        AsyncStorage.setItem("user", JSON.stringify(payload));
        console.log("User data saved to AsyncStorage after sign in");
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
        const updatedUser = {
          ...state.user,
          displayName: action.payload.displayName,
          bio: action.payload.bio,
          photoURL: action.payload.photoURL, // Update photoURL
        };
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
      })

      // Fetch user data
      .addCase(fetchUserData.pending, (state) => {
        // We don't set loading to true here to avoid UI flicker
        // since this is a background refresh
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        console.log(
          "User data updated in Redux store with fresh Firestore data"
        );
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        console.error("Failed to fetch fresh user data:", action.payload);
        // We don't set the error in the state to avoid showing error messages
        // for background refreshes
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

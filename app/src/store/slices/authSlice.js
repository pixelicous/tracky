import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
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
import { auth, db, googleProvider } from "../../services/api/firebase";
import Constants from "expo-constants";

// Import GoogleSignin conditionally to prevent native module errors
let GoogleSignin;
try {
  const GoogleSigninModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = GoogleSigninModule.GoogleSignin;
} catch (error) {
  console.warn("Google Sign-In module not available:", error.message);
}
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storeAuthCredentials } from "../../utils/authUtils";

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

      // Store credentials for session restoration
      await storeAuthCredentials(email, password);

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

      // Store credentials for session restoration
      await storeAuthCredentials(email, password);

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

export const signInWithGoogle = createAsyncThunk(
  "auth/signInWithGoogle",
  async (_, { rejectWithValue }) => {
    try {
      // Check if GoogleSignin is available
      if (!GoogleSignin) {
        return rejectWithValue(
          "Google Sign-In is not properly set up. Please follow the setup instructions in GOOGLE_SIGNIN_SETUP.md"
        );
      }

      let idToken;
      let googleUserInfo = null;
      try {
        // Attempt configuration immediately before use
        const googleWebClientId =
          Constants.expoConfig?.extra?.googleWebClientId;
        if (!googleWebClientId) {
          console.warn(
            "Google Web Client ID not found in app config. Google Sign-In may not work."
          );
          return rejectWithValue(
            "Google Web Client ID missing in configuration."
          );
        }
        try {
          console.log("Attempting to configure Google Sign-In within thunk...");
          console.log("Using Google Web Client ID:", googleWebClientId);

          // Configure GoogleSignin with the web client ID
          GoogleSignin.configure({
            webClientId: googleWebClientId,
            offlineAccess: true,
          });

          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
        } catch (playServicesError) {
          console.error(
            "Google Play Services Error:",
            JSON.stringify(playServicesError, null, 2)
          );
          return rejectWithValue(
            `Google Play Services error (code: ${
              playServicesError.code || "unknown"
            }). Ensure Google Play Services are up-to-date and configured.`
          );
        }

        // Get user ID token
        // await GoogleSignin.hasPlayServices(); // Check moved above
        let signInResult;
        try {
          console.log("Attempting GoogleSignin.signIn()...");
          signInResult = await GoogleSignin.signIn();
          console.log(
            "signInResult from GoogleSignin.signIn():",
            JSON.stringify(signInResult, null, 2)
          );
          // The idToken is inside the data property
          idToken = signInResult.data?.idToken;

          // Save Google user info from the sign-in result
          if (signInResult.data?.user) {
            googleUserInfo = signInResult.data.user;
            console.log(
              "Captured Google user info:",
              JSON.stringify(googleUserInfo, null, 2)
            );
          }

          if (!idToken) {
            console.error("No ID token found in Google Sign-In result");
            return rejectWithValue(
              "Failed to get ID token from Google Sign-In"
            );
          }

          // Store Google credentials for session restoration
          const email = signInResult.data?.user?.email;
          if (email) {
            console.log("Storing Google credentials for session restoration");
            console.log("Email:", email);
            console.log(
              "ID Token (first 10 chars):",
              idToken.substring(0, 10) + "..."
            );

            const {
              storeGoogleAuthCredentials,
            } = require("../../utils/authUtils");

            await storeGoogleAuthCredentials(email, idToken);

            // Verify the credentials were stored
            const storedCreds = await AsyncStorage.getItem("auth_credentials");
            const parsedCreds = JSON.parse(storedCreds);
            console.log(
              "Verified stored credentials - Provider:",
              parsedCreds.provider,
              "Email:",
              parsedCreds.email,
              "Has ID Token:",
              !!parsedCreds.idToken
            );
          } else {
            console.error("No email found in Google Sign-In result");
          }
        } catch (signInError) {
          console.error(
            "!!! Error during GoogleSignin.signIn():",
            JSON.stringify(signInError, null, 2)
          );
          return rejectWithValue(
            `Google Sign-In failed during signIn(): ${signInError.message}`
          );
        }
      } catch (error) {
        // Log the full error object for more details
        console.error(
          "Google Sign-In native module error:",
          JSON.stringify(error, null, 2)
        );
        console.error("Google Sign-In error code:", error.code); // Log specific error code if available
        return rejectWithValue(
          `Google Sign-In failed (code: ${
            error.code || "unknown"
          }). Check device logs and GOOGLE_SIGNIN_SETUP.md`
        );
      }

      // Create a Google credential with the token
      console.log("ID Token before signInWithCredential:", idToken);

      const credential = GoogleAuthProvider.credential(idToken);

      console.log(
        "Credential object after creation:",
        JSON.stringify(credential, null, 2)
      );

      // Sign in to Firebase with the Google credential
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Check if user document exists
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Get Google user info from provider data
        googleUserInfo = user.providerData?.find(
          (provider) => provider.providerId === "google.com"
        );

        // Create new user document if it doesn't exist
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || googleUserInfo?.name || "",
          photoURL: user.photoURL || googleUserInfo?.photo || null,
          givenName:
            googleUserInfo?.givenName ||
            googleUserInfo?.displayName?.split(" ")?.[0] ||
            "",
          familyName:
            googleUserInfo?.familyName ||
            googleUserInfo?.displayName?.split(" ")?.[1] ||
            "",
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          accountCreationMethod: "google",
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

        // Show a notification or alert that the account was created
        console.log("New user account created with Google Sign-In");
      } else {
        // Update last active timestamp
        await updateDoc(userDocRef, {
          lastActive: serverTimestamp(),
        });
      }
      // Get user data
      const freshUserDoc = await getDoc(userDocRef);
      const docData = freshUserDoc.data();

      // Check if this was a new account creation
      const isNewAccount = !userDoc.exists();

      // Update Google user info if available (make sure it's in scope)
      googleUserInfo =
        user.providerData?.find(
          (provider) => provider.providerId === "google.com"
        ) || googleUserInfo;

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName:
          user.displayName ||
          docData?.displayName ||
          googleUserInfo?.name ||
          "",
        photoURL:
          user.photoURL || docData?.photoURL || googleUserInfo?.photo || null,
        givenName: docData?.givenName || googleUserInfo?.givenName || "",
        familyName: docData?.familyName || googleUserInfo?.familyName || "",
        ...docData,
        // Make sure accountCreationMethod is included
        accountCreationMethod:
          docData?.accountCreationMethod ||
          (isNewAccount ? "google" : "unknown"),
        isNewAccount: isNewAccount, // Add flag to indicate if this was a new account
        createdAt: docData?.createdAt?.toDate?.()?.toISOString() || null,
        lastActive: docData?.lastActive?.toDate?.()?.toISOString() || null,
        updatedAt: docData?.updatedAt?.toDate?.()?.toISOString() || null,
      };

      // Store user data in AsyncStorage for session restoration
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      console.log("User data stored in AsyncStorage for session restoration");

      return userData;
    } catch (error) {
      console.error("Google Sign In Error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut(auth);
      // Clear stored credentials
      await AsyncStorage.removeItem("auth_credentials");
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

// Refresh Firebase auth token
export const refreshAuthToken = createAsyncThunk(
  "auth/refreshAuthToken",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Attempting to refresh Firebase auth token");

      // Get the current user from Firebase Auth
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.log("No current user in Firebase Auth");
        return null;
      }

      // Force token refresh
      await currentUser.getIdToken(true);
      console.log("Firebase auth token refreshed successfully");

      return true;
    } catch (error) {
      console.error("Error refreshing auth token:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  "auth/loadUserFromStorage",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      console.log("Attempting to restore user session from AsyncStorage");

      // First try to refresh the auth token
      const { ensureFreshAuthToken } = require("../../utils/authUtils");
      const tokenRefreshed = await ensureFreshAuthToken();

      if (!tokenRefreshed) {
        console.log("Failed to refresh auth token, clearing stored data");
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("auth_credentials");
        return null;
      }

      // Now try to get the user data
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        console.log("User found in AsyncStorage, restoring session");

        // After loading from storage and refreshing token, fetch fresh data if we have a user ID
        if (parsedUserData && parsedUserData.uid) {
          // Refresh the Firebase auth token
          console.log("User found in storage, refreshing auth token");
          await dispatch(refreshAuthToken()).unwrap();

          // Then fetch fresh user data
          dispatch(fetchUserData());
        }

        const theme = parsedUserData?.preferences?.theme;
        if (theme) {
          dispatch(setTheme(theme));
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

// Initialize Firebase Auth state listener
export const initializeAuthListener = createAsyncThunk(
  "auth/initializeAuthListener",
  async (_, { dispatch }) => {
    try {
      console.log("Setting up Firebase Auth state listener");

      // Set up auth listener
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log(
          "Auth state changed:",
          user
            ? `User logged in (${user.providerData[0]?.providerId})`
            : "No user"
        );

        if (user) {
          // Check if this is a Google user
          const isGoogleUser = user.providerData.some(
            (provider) => provider.providerId === "google.com"
          );

          console.log("Is Google user:", isGoogleUser);

          // Fetch fresh user data
          dispatch(fetchUserData());
        } else {
          // If no user, dispatch signOut action
          console.log("No user in Firebase Auth, clearing Redux state");
          dispatch({ type: "auth/signOut/fulfilled", payload: null });
        }
      });

      // Store the unsubscribe function in a global variable
      // This is not ideal, but it's a workaround for the non-serializable value issue
      global._authUnsubscribe = unsubscribe;

      // Return a serializable value instead of the function
      return { initialized: true };
    } catch (error) {
      console.error("Error initializing auth listener:", error);
      return { initialized: false, error: error.message };
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
        // Do not reject here, just return to indicate no user to fetch for
        return null;
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
    authListenerInitialized: false,
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
    // Google Sign In
    builder
      .addCase(signInWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        AsyncStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

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
        // Dispatch fetchUserData after state is updated
        if (state.user && state.user.uid) {
          // This ensures the app loads quickly with cached data first
          // and then updates with fresh data in the background
          // The component that dispatches loadUserFromStorage should dispatch fetchUserData
          // dispatch(fetchUserData()); // Removed dispatch from here
        }
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
        // Only update user if action.payload is not null (i.e., user data was fetched)
        if (action.payload) {
          state.user = action.payload;
          console.log(
            "User data updated in Redux store with fresh Firestore data"
          );
        }
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        console.error("Failed to fetch fresh user data:", action);
        // We don't set the error in the state to avoid showing error messages
        // for background refreshes
        // The error is logged, but the state remains unchanged
      })

      // Handle refreshAuthToken
      .addCase(refreshAuthToken.pending, (state) => {
        // Don't set loading to true to avoid UI flicker
        state.error = null;
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        // Token refreshed successfully, no need to update state
        console.log("Auth token refreshed successfully");
      })
      .addCase(refreshAuthToken.rejected, (state, action) => {
        console.error("Failed to refresh auth token:", action);
        // If token refresh fails, we should clear the user state
        // as the user is likely no longer authenticated
        state.user = null;
        state.isAuthenticated = false;
        AsyncStorage.removeItem("user");
      })

      // Handle initializeAuthListener
      .addCase(initializeAuthListener.pending, (state) => {
        // Don't set loading to true to avoid UI flicker
        state.error = null;
      })
      .addCase(initializeAuthListener.fulfilled, (state, action) => {
        // Auth listener initialized successfully
        state.authListenerInitialized = true;
        console.log("Auth listener initialized successfully");
      })
      .addCase(initializeAuthListener.rejected, (state, action) => {
        console.error("Failed to initialize auth listener:", action);
        state.authListenerInitialized = false;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

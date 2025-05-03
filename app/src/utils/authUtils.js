import { auth } from "../services/api/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import Constants from "expo-constants";

// Import GoogleSignin conditionally to prevent native module errors
let GoogleSignin;
try {
  const GoogleSigninModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = GoogleSigninModule.GoogleSignin;
} catch (error) {
  console.warn("Google Sign-In module not available:", error.message);
}

/**
 * Ensures the Firebase auth token is fresh before making Firestore operations
 * @returns {Promise<boolean>} True if token was refreshed or is valid, false otherwise
 */
export const ensureFreshAuthToken = async () => {
  try {
    console.log("ensureFreshAuthToken called");

    // Disable the auth state listener temporarily
    let unsubscribe;
    if (auth.onAuthStateChanged) {
      unsubscribe = auth.onAuthStateChanged(() => {});
    }

    const currentUser = auth.currentUser;

    if (currentUser) {
      // If we have a current user, just refresh the token
      try {
        await currentUser.getIdToken(true);
        console.log("Auth token refreshed successfully for current user");
        if (unsubscribe) unsubscribe();
        return true;
      } catch (tokenError) {
        console.error(
          "Error refreshing auth token for current user:",
          tokenError
        );
        if (unsubscribe) unsubscribe();
        return false;
      }
    }

    console.log("No authenticated user found, attempting to restore session");

    // Try to restore the session from AsyncStorage
    const userData = await AsyncStorage.getItem("user");
    if (!userData) {
      console.error("No user data in AsyncStorage");
      if (unsubscribe) unsubscribe();
      return false;
    }

    const parsedUserData = JSON.parse(userData);
    if (!parsedUserData || !parsedUserData.email) {
      console.error("Invalid user data in AsyncStorage");
      if (unsubscribe) unsubscribe();
      return false;
    }

    // Check if we have stored credentials
    const credentials = await AsyncStorage.getItem("auth_credentials");
    if (!credentials) {
      console.error("No stored credentials found");
      if (unsubscribe) unsubscribe();
      return false;
    }

    const parsedCredentials = JSON.parse(credentials);
    console.log("Found credentials for provider:", parsedCredentials.provider);

    // Re-authenticate based on provider
    try {
      if (parsedCredentials.provider === "google") {
        console.log("Attempting to restore Google Sign-In session");

        if (!GoogleSignin) {
          console.error("Google Sign-In module not available");
          return false;
        }

        // Configure GoogleSignin with the web client ID
        const googleWebClientId =
          Constants.expoConfig?.extra?.googleWebClientId;
        if (!googleWebClientId) {
          console.error("Google Web Client ID not found in app config");
          return false;
        }

        console.log(
          "Configuring GoogleSignin with web client ID:",
          googleWebClientId
        );
        GoogleSignin.configure({
          webClientId: googleWebClientId,
          offlineAccess: true,
        });

        try {
          // IMPORTANT: Always try to use the stored ID token first
          // This is more reliable than silent sign-in
          if (parsedCredentials.idToken) {
            console.log("Using stored ID token from credentials");
            try {
              const credential = GoogleAuthProvider.credential(
                parsedCredentials.idToken
              );
              await signInWithCredential(auth, credential);
              console.log(
                "Re-authenticated with stored Google token successfully"
              );
              return true;
            } catch (credentialError) {
              console.error(
                "Error using stored credential, will try other methods:",
                credentialError
              );
              // Continue to other methods if this fails
            }
          }

          // First check if user is already signed in
          const isSignedIn = await GoogleSignin.isSignedIn();
          console.log("Is user already signed in with Google:", isSignedIn);

          let tokens;

          if (isSignedIn) {
            // If already signed in, get tokens
            tokens = await GoogleSignin.getTokens();
            console.log("Got tokens from existing Google session");
          } else {
            // Try silent sign in
            try {
              console.log("Attempting silent sign-in");
              const silentSignIn = await GoogleSignin.signInSilently();
              console.log("Silent sign-in successful");
              tokens = { idToken: silentSignIn.idToken };
            } catch (silentError) {
              console.error("Silent sign-in failed:", silentError);
              return false;
            }
          }

          if (!tokens || !tokens.idToken) {
            console.error("Failed to get Google ID token");
            return false;
          }

          // Sign in to Firebase with Google credential
          const credential = GoogleAuthProvider.credential(tokens.idToken);
          await signInWithCredential(auth, credential);
          console.log("Re-authenticated with Google successfully");

          // Update stored credentials with new token
          await storeGoogleAuthCredentials(
            parsedUserData.email,
            tokens.idToken
          );

          return true;
        } catch (googleError) {
          console.error("Failed to restore Google session:", googleError);
          if (unsubscribe) unsubscribe();
          return false;
        }
      } else {
        // Default to email/password authentication
        if (!parsedCredentials.email || !parsedCredentials.password) {
          console.error("Invalid credentials in storage");
          return false;
        }

        await signInWithEmailAndPassword(
          auth,
          parsedCredentials.email,
          parsedCredentials.password
        );
        console.log("Re-authenticated with email/password successfully");
        return true;
      }
    } catch (authError) {
      console.error("Failed to re-authenticate:", authError);
      if (unsubscribe) unsubscribe();
      return false;
    }
  } catch (error) {
    console.error("Error in ensureFreshAuthToken:", error);
    if (unsubscribe) unsubscribe();
    return false;
  } finally {
    // Re-enable the auth state listener
    if (unsubscribe) unsubscribe();
  }
};

/**
 * Stores authentication credentials securely for session restoration
 * @param {string} email User's email
 * @param {string} password User's password
 * @param {string} provider Authentication provider (email, google)
 * @param {string} idToken ID token for OAuth providers
 */
export const storeAuthCredentials = async (
  email,
  password,
  provider = "email",
  idToken = null
) => {
  try {
    await AsyncStorage.setItem(
      "auth_credentials",
      JSON.stringify({ provider, email, password, idToken })
    );
    console.log(
      `Auth credentials stored successfully for provider: ${provider}`
    );
    return true;
  } catch (error) {
    console.error("Error storing auth credentials:", error);
    return false;
  }
};

/**
 * Stores Google authentication credentials for session restoration
 * @param {string} email User's email
 * @param {string} idToken Google ID token
 */
export const storeGoogleAuthCredentials = async (email, idToken) => {
  return storeAuthCredentials(email, null, "google", idToken);
};

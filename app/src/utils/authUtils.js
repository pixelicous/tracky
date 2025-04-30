import { auth } from "../services/api/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";

/**
 * Ensures the Firebase auth token is fresh before making Firestore operations
 * @returns {Promise<boolean>} True if token was refreshed or is valid, false otherwise
 */
export const ensureFreshAuthToken = async () => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("No authenticated user found, attempting to restore session");

      // Try to restore the session from AsyncStorage
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        console.error("No user data in AsyncStorage");
        return false;
      }

      const parsedUserData = JSON.parse(userData);
      if (!parsedUserData || !parsedUserData.email) {
        console.error("Invalid user data in AsyncStorage");
        return false;
      }

      // Check if we have stored credentials
      const credentials = await AsyncStorage.getItem("auth_credentials");
      if (!credentials) {
        console.error("No stored credentials found");
        return false;
      }

      const { email, password } = JSON.parse(credentials);
      if (!email || !password) {
        console.error("Invalid credentials in storage");
        return false;
      }

      // Re-authenticate with stored credentials
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Re-authenticated successfully");
        return true;
      } catch (authError) {
        console.error("Failed to re-authenticate:", authError);
        return false;
      }
    }

    // If we have a current user, just refresh the token
    try {
      await currentUser.getIdToken(true);
      console.log("Auth token refreshed successfully");
      return true;
    } catch (tokenError) {
      console.error("Error refreshing auth token:", tokenError);
      return false;
    }
  } catch (error) {
    console.error("Error in ensureFreshAuthToken:", error);
    return false;
  }
};

/**
 * Stores authentication credentials securely for session restoration
 * @param {string} email User's email
 * @param {string} password User's password
 */
export const storeAuthCredentials = async (email, password) => {
  try {
    await AsyncStorage.setItem(
      "auth_credentials",
      JSON.stringify({ email, password })
    );
    console.log("Auth credentials stored successfully");
    return true;
  } catch (error) {
    console.error("Error storing auth credentials:", error);
    return false;
  }
};

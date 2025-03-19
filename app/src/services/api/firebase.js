import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Firebase configuration
// In a real app, these would be in environment variables
const firebaseConfig = {
  apiKey: Constants.manifest?.extra?.firebaseApiKey || "YOUR_API_KEY",
  authDomain:
    Constants.manifest?.extra?.firebaseAuthDomain || "YOUR_AUTH_DOMAIN",
  projectId: Constants.manifest?.extra?.firebaseProjectId || "YOUR_PROJECT_ID",
  storageBucket:
    Constants.manifest?.extra?.firebaseStorageBucket || "YOUR_STORAGE_BUCKET",
  messagingSenderId:
    Constants.manifest?.extra?.firebaseMessagingSenderId ||
    "YOUR_MESSAGING_SENDER_ID",
  appId: Constants.manifest?.extra?.firebaseAppId || "YOUR_APP_ID",
  measurementId:
    Constants.manifest?.extra?.firebaseMeasurementId || "YOUR_MEASUREMENT_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Export Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators if running in development
if (process.env.NODE_ENV === "development") {
  connectAuthEmulator(auth, "http://192.168.0.125:9099");
  connectFirestoreEmulator(firestore, "192.168.0.125", 8080);
  connectStorageEmulator(storage, "192.168.0.125", 9199);
  connectFunctionsEmulator(functions, "192.168.0.125", 5001);
}

export default app;

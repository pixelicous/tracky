// firebase.config.js
import Constants from "expo-constants";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Get environment
const env = Constants.expoConfig?.extra?.env || "development";

// Firebase config settings
let firebaseConfig;

if (env === "development") {
  // Use dummy values for emulator
  firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-app.firebaseapp.com",
    projectId: "trackies-dev",
    storageBucket: "demo-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456789",
  };
  console.log("🔥 Using Firebase Emulators with dummy config");
} else {
  // Use real config values for production/test
  firebaseConfig = {
    apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
    authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
    projectId: Constants.expoConfig?.extra?.firebaseProjectId,
    storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
    messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
    appId: Constants.expoConfig?.extra?.firebaseAppId,
  };
  console.log("✅ Using Live Firebase Services");
}

// Initialize Firebase
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  console.error("Error initializing Firebase:", e);
  // Handle the error appropriately, e.g., show an error message to the user
  throw e; // Re-throw the error to prevent the app from crashing
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Enable Emulators in Development
if (env === "development") {
  // Your local IP address - change if needed
  const localEmulatorHost = "192.168.0.126";

  // Connect to emulators
  connectAuthEmulator(auth, `http://${localEmulatorHost}:9099`);
  connectFirestoreEmulator(db, localEmulatorHost, 8080);
  connectFunctionsEmulator(functions, localEmulatorHost, 5001);
  connectStorageEmulator(storage, localEmulatorHost, 9199);

  console.log(`🔥 Connected to emulators at ${localEmulatorHost}`);
}

// Export initialized services for use in the app
export { app, auth, db, functions, storage };

// For backward compatibility
export default app;

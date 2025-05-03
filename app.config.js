export default {
  expo: {
    name: "Daily Habits Tracker",
    slug: "daily-habits-tracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.pixelabs.trackies",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.pixelabs.trackies",
    },
    web: {
      favicon: "./assets/images/favicon.png",
    },
    extra: {
      // firebaseApiKey: process.env.FIREBASE_API_KEY,
      // firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      // firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      // firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      // firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      // firebaseAppId: process.env.FIREBASE_APP_ID,
      // firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      revenuecatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY, // Assuming this also needs the prefix
      eas: {
        projectId: "1747ea17-646e-4a9f-8b24-877804b91453",
      },
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#ffffff",
        },
      ],
    ],
  },
};

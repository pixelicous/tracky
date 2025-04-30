import React, { useEffect, useState } from "react";
import { LogBox, StatusBar } from "react-native";
import { Provider } from "react-redux";
import { store } from "./src/store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./src/theme";
import Navigation from "./src/navigation";
import { auth } from "./src/services/api/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  setUser,
  loadUserFromStorage,
  fetchUserData,
} from "./src/store/slices/authSlice";
import {
  setFirstLaunch,
  setOnboardingComplete,
} from "./src/store/slices/uiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Ignore specific warnings
LogBox.ignoreLogs([
  "Setting a timer for a long period of time",
  "AsyncStorage has been extracted from react-native",
  "Non-serializable values were found in the navigation state",
]);

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        // Load fonts
        await Font.loadAsync({
          ...Ionicons.font,
          "Roboto-Regular": require("./assets/fonts/Roboto-Regular.ttf"),
          "Roboto-Medium": require("./assets/fonts/Roboto-Medium.ttf"),
          "Roboto-Bold": require("./assets/fonts/Roboto-Bold.ttf"),
          "Roboto-SemiBold": require("./assets/fonts/Roboto-Bold.ttf"), // Using Bold as SemiBold substitute
        });

        // Check if it's the first launch
        const isFirstLaunch = await AsyncStorage.getItem("isFirstLaunch");
        if (isFirstLaunch === null) {
          store.dispatch(setFirstLaunch(true));
          await AsyncStorage.setItem("isFirstLaunch", "false");
        } else {
          store.dispatch(setFirstLaunch(false));
        }

        // Check if onboarding is complete
        const onboardingComplete = await AsyncStorage.getItem(
          "onboardingComplete"
        );
        store.dispatch(setOnboardingComplete(onboardingComplete === "true"));

        // Load user from AsyncStorage using the thunk to quickly show cached data
        await store.dispatch(loadUserFromStorage());
        console.log("Attempted to restore user session from AsyncStorage");

        // Set up auth listener and wait for initial auth state
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log(
            "onAuthStateChanged triggered. User:",
            user ? user.uid : "null"
          );
          // Set the user in the Redux store based on the auth state
          store.dispatch(setUser(user)); // Set user to null if not logged in

          if (user) {
            // If a user is logged in, fetch fresh user data
            await store.dispatch(fetchUserData());
          }

          // Set user loaded to true after initial auth state is determined
          setUserLoaded(true);
        });

        // Clean up the listener on unmount
        return () => unsubscribe();
      } catch (e) {
        console.warn("Error loading app:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepareApp();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen when the app is ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (!userLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.white}
        />
        <Navigation />
      </SafeAreaProvider>
    </Provider>
  );
}

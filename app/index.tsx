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
import { setUser, loadUserFromStorage } from "./src/store/slices/authSlice";
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

        // Load user from AsyncStorage using the thunk
        await store.dispatch(loadUserFromStorage());
        console.log("Attempted to restore user session from AsyncStorage");

        // Set user loaded to true regardless of authentication status
        setUserLoaded(true);

        // Set up auth listener for future auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user && !store.getState().auth.user) {
            // Only update if there's an actual Firebase user
            store.dispatch(setUser(user));
          }
        });

        return unsubscribe;
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

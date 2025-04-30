import React, { useEffect, useState } from "react";
import { LogBox, StatusBar } from "react-native";
import { Provider } from "react-redux";
import { store } from "./app/src/store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./app/src/theme";
import Navigation from "./app/src/navigation";
import { auth } from "./app/src/services/api/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  loadUserFromStorage,
  refreshAuthToken,
} from "./app/src/store/slices/authSlice";
import { ensureFreshAuthToken } from "./app/src/utils/authUtils";
import {
  setFirstLaunch,
  setOnboardingComplete,
} from "./app/src/store/slices/uiSlice";
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

        // Try to restore authentication session
        const isAuthenticated = await ensureFreshAuthToken();
        console.log("Authentication session restored:", isAuthenticated);

        // Load user from storage
        await store.dispatch(loadUserFromStorage());
        setUserLoaded(true);
        // Fetch fresh user data after loading from storage
        if (store.getState().auth.user && store.getState().auth.user.uid) {
          store.dispatch(fetchUserData());
        }
        // Refresh token after loading user and fetching data
        if (store.getState().auth.user && store.getState().auth.user.uid) {
          store.dispatch(refreshAuthToken());
        }

        // Set up auth listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log(
            "Auth state changed:",
            user ? "User logged in" : "No user"
          );
          if (user) {
            if (!store.getState().auth.user) {
              // If we have a Firebase user but no Redux user, load from storage
              store.dispatch(loadUserFromStorage());
            } else {
              // If we already have a user in Redux, just refresh the token
              store.dispatch(refreshAuthToken());
            }
          } else {
            // If Firebase says no user but we have one in Redux, try to restore session
            if (store.getState().auth.user) {
              console.log(
                "Firebase says no user but Redux has one, trying to restore session"
              );
              ensureFreshAuthToken();
            }
          }
        });

        // Simulate some loading time for demo purposes
        await new Promise((resolve) => setTimeout(resolve, 1000));

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
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={theme.colors.white}
          />
          <Navigation />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Provider>
  );
}

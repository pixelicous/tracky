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
import { loadUserFromStorage } from "./app/src/store/slices/authSlice";
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

        // Load user from storage
        await store.dispatch(loadUserFromStorage());
        setUserLoaded(true);

        // Set up auth listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user && !store.getState().auth.user) {
            store.dispatch(loadUserFromStorage());
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

import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: "default",
    notifications: [],
    modalVisible: false,
    currentModal: null,
    isFirstLaunch: true,
    onboardingComplete: false,
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      // Persist theme preference
      AsyncStorage.setItem("theme", action.payload);
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setModalVisible: (state, action) => {
      state.modalVisible = action.payload;
    },
    setCurrentModal: (state, action) => {
      state.currentModal = action.payload;
      state.modalVisible = !!action.payload;
    },
    setFirstLaunch: (state, action) => {
      state.isFirstLaunch = action.payload;
      // Persist first launch state
      AsyncStorage.setItem("isFirstLaunch", JSON.stringify(action.payload));
    },
    setOnboardingComplete: (state, action) => {
      state.onboardingComplete = action.payload;
      // Persist onboarding state
      AsyncStorage.setItem(
        "onboardingComplete",
        JSON.stringify(action.payload)
      );
    },
  },
});

export const {
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  setModalVisible,
  setCurrentModal,
  setFirstLaunch,
  setOnboardingComplete,
} = uiSlice.actions;

export default uiSlice.reducer;

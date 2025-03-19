import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import habitsReducer from "./slices/habitsSlice";
import progressReducer from "./slices/progressSlice";
import socialReducer from "./slices/socialSlice";
import premiumReducer from "./slices/premiumSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    habits: habitsReducer,
    progress: progressReducer,
    social: socialReducer,
    premium: premiumReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["auth/setUser"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["meta.arg", "payload.timestamp"],
        // Ignore these paths in the state
        ignoredPaths: ["auth.user", "habits.currentHabit"],
      },
    }),
});

export default store;

// src/store/slices/habitsSlice.js

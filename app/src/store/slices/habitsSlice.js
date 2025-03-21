import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/api/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Async thunks for habits
export const fetchHabits = createAsyncThunk(
  "habits/fetchHabits",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Get habits from Firestore
      const habitsQuery = query(
        collection(db, "habits"),
        where("userId", "==", uid),
        where("isArchived", "==", false),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(habitsQuery);
      const habits = [];

      querySnapshot.forEach((doc) => {
        habits.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Cache habits locally
      await AsyncStorage.setItem(`habits_${uid}`, JSON.stringify(habits));

      return habits;
    } catch (error) {
      // Try to get habits from local storage
      try {
        const { uid } = getState().auth.user;
        const cachedHabits = await AsyncStorage.getItem(`habits_${uid}`);
        if (cachedHabits) {
          return JSON.parse(cachedHabits);
        }
      } catch (storageError) {
        console.error("Error retrieving cached habits:", storageError);
      }

      return rejectWithValue(error.message);
    }
  }
);

export const createHabit = createAsyncThunk(
  "habits/createHabit",
  async (habitData, { getState, rejectWithValue }) => {
    try {
      console.log("Creating habit:", habitData);
      const { uid } = getState().auth.user;
      console.log("User ID:", uid);

      const newHabit = {
        ...habitData,
        userId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isArchived: false,
        progress: {
          streak: 0,
          lastCompleted: null,
          history: {},
        },
      };

      console.log("New habit object:", newHabit);

      const docRef = await addDoc(collection(db, "habits"), newHabit);

      console.log("Document reference:", docRef);

      return {
        id: docRef.id,
        ...newHabit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error creating habit:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateHabit = createAsyncThunk(
  "habits/updateHabit",
  async ({ id, habitData }, { rejectWithValue }) => {
    try {
      const habitRef = doc(firestore, "habits", id);

      await updateDoc(habitRef, {
        ...habitData,
        updatedAt: serverTimestamp(),
      });

      return {
        id,
        ...habitData,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeHabit = createAsyncThunk(
  "habits/completeHabit",
  async ({ id, date, count = 1 }, { getState, dispatch, rejectWithValue }) => {
    try {
      const habitRef = doc(firestore, "habits", id);
      const habits = getState().habits.items;
      const habit = habits.find((h) => h.id === id);

      if (!habit) {
        return rejectWithValue("Habit not found");
      }

      const dateStr = date || new Date().toISOString().split("T")[0];
      const currentDate = new Date();
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Calculate streak
      let newStreak = habit.progress.streak;
      let wasStreakIncremented = false;

      // If already completed today, just update the count
      if (habit.progress.history && habit.progress.history[dateStr]) {
        const newHistory = {
          ...habit.progress.history,
          [dateStr]: habit.progress.history[dateStr] + count,
        };

        await updateDoc(habitRef, {
          "progress.history": newHistory,
          updatedAt: serverTimestamp(),
        });

        return {
          id,
          progress: {
            ...habit.progress,
            history: newHistory,
          },
          streakIncremented: false,
        };
      }

      // Check if this is first completion or continuing a streak
      if (!habit.progress.lastCompleted) {
        // First completion ever
        newStreak = 1;
        wasStreakIncremented = true;
      } else {
        const lastCompletedDate = new Date(habit.progress.lastCompleted);
        const lastCompletedStr = lastCompletedDate.toISOString().split("T")[0];

        if (dateStr === lastCompletedStr) {
          // Already completed today, no streak change
        } else if (
          dateStr === yesterdayStr ||
          yesterdayStr === lastCompletedStr
        ) {
          // Completing for today or catching up on yesterday
          newStreak += 1;
          wasStreakIncremented = true;
        } else {
          // Streak broken, starting new streak
          newStreak = 1;
          wasStreakIncremented = false;
        }
      }

      // Update habit progress
      const newHistory = {
        ...habit.progress.history,
        [dateStr]: count,
      };

      await updateDoc(habitRef, {
        "progress.streak": newStreak,
        "progress.lastCompleted": currentDate.toISOString(),
        "progress.history": newHistory,
        updatedAt: serverTimestamp(),
      });

      // If streak was incremented, update user stats
      if (wasStreakIncremented) {
        const { uid } = getState().auth.user;
        const userRef = doc(firestore, "users", uid);

        // Need to import increment
        const { increment } = require("firebase/firestore");

        await updateDoc(userRef, {
          "stats.totalHabitsCompleted": increment(1),
          "stats.currentStreak": increment(1),
          "stats.xpPoints": increment(10), // Basic XP for completion
          updatedAt: serverTimestamp(),
        });

        // Dispatch action to update user stats in auth state
        dispatch(
          updateUserProfile({
            stats: {
              ...getState().auth.user.stats,
              totalHabitsCompleted:
                getState().auth.user.stats.totalHabitsCompleted + 1,
              currentStreak: getState().auth.user.stats.currentStreak + 1,
              xpPoints: getState().auth.user.stats.xpPoints + 10,
            },
          })
        );
      }

      return {
        id,
        progress: {
          streak: newStreak,
          lastCompleted: currentDate.toISOString(),
          history: newHistory,
        },
        streakIncremented: wasStreakIncremented,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteHabit = createAsyncThunk(
  "habits/deleteHabit",
  async (id, { rejectWithValue }) => {
    try {
      // Instead of actually deleting, we archive the habit
      const habitRef = doc(firestore, "habits", id);

      await updateDoc(habitRef, {
        isArchived: true,
        updatedAt: serverTimestamp(),
      });

      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Habits slice
const habitsSlice = createSlice({
  name: "habits",
  initialState: {
    items: [],
    dailyHabits: [],
    loading: false,
    error: null,
    currentHabit: null,
  },
  reducers: {
    setCurrentHabit: (state, action) => {
      state.currentHabit = action.payload;
    },
    clearCurrentHabit: (state) => {
      state.currentHabit = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch habits
      .addCase(fetchHabits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHabits.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;

        // Filter daily habits for quick access
        const today = new Date().getDay();
        state.dailyHabits = action.payload.filter((habit) => {
          if (habit.frequency.type === "daily") return true;
          if (
            habit.frequency.type === "weekly" &&
            habit.frequency.days.includes(today)
          ) {
            return true;
          }
          return false;
        });
      })
      .addCase(fetchHabits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create habit
      .addCase(createHabit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHabit.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [action.payload, ...state.items];

        // Update daily habits if needed
        const today = new Date().getDay();
        if (
          action.payload.frequency.type === "daily" ||
          (action.payload.frequency.type === "weekly" &&
            action.payload.frequency.days.includes(today))
        ) {
          state.dailyHabits = [action.payload, ...state.dailyHabits];
        }
      })
      .addCase(createHabit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update habit
      .addCase(updateHabit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHabit.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((habit) =>
          habit.id === action.payload.id
            ? { ...habit, ...action.payload }
            : habit
        );

        // Update daily habits
        const today = new Date().getDay();
        state.dailyHabits = state.items.filter((habit) => {
          if (habit.frequency.type === "daily") return true;
          if (
            habit.frequency.type === "weekly" &&
            habit.frequency.days.includes(today)
          ) {
            return true;
          }
          return false;
        });
      })
      .addCase(updateHabit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Complete habit
      .addCase(completeHabit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeHabit.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((habit) =>
          habit.id === action.payload.id
            ? { ...habit, progress: action.payload.progress }
            : habit
        );

        // Update dailyHabits as well
        state.dailyHabits = state.dailyHabits.map((habit) =>
          habit.id === action.payload.id
            ? { ...habit, progress: action.payload.progress }
            : habit
        );

        // Update current habit if it was the one completed
        if (state.currentHabit && state.currentHabit.id === action.payload.id) {
          state.currentHabit = {
            ...state.currentHabit,
            progress: action.payload.progress,
          };
        }
      })
      .addCase(completeHabit.rejected, (state) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete habit
      .addCase(deleteHabit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHabit.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (habit) => habit.id !== action.payload
        );
        state.dailyHabits = state.dailyHabits.filter(
          (habit) => habit.id !== action.payload
        );

        // Clear current habit if it was the one deleted
        if (state.currentHabit && state.currentHabit.id === action.payload) {
          state.currentHabit = null;
        }
      })
      .addCase(deleteHabit.rejected, (state) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentHabit, clearCurrentHabit, clearError } =
  habitsSlice.actions;
export default habitsSlice.reducer;

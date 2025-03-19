import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../../services/api/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Async thunks for progress tracking
export const fetchAchievements = createAsyncThunk(
  "progress/fetchAchievements",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Get achievements from Firestore
      const achievementsQuery = query(
        collection(firestore, "achievements"),
        where("userId", "==", uid),
        orderBy("unlockedAt", "desc")
      );

      const querySnapshot = await getDocs(achievementsQuery);
      const achievements = [];

      querySnapshot.forEach((doc) => {
        achievements.push({
          id: doc.id,
          ...doc.data(),
          unlockedAt:
            doc.data().unlockedAt?.toDate?.() || doc.data().unlockedAt,
        });
      });

      // Cache achievements locally
      await AsyncStorage.setItem(
        `achievements_${uid}`,
        JSON.stringify(achievements)
      );

      return achievements;
    } catch (error) {
      // Try to get achievements from local storage
      try {
        const { uid } = getState().auth.user;
        const cachedAchievements = await AsyncStorage.getItem(
          `achievements_${uid}`
        );
        if (cachedAchievements) {
          return JSON.parse(cachedAchievements);
        }
      } catch (storageError) {
        console.error("Error retrieving cached achievements:", storageError);
      }

      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  "progress/fetchUserStats",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;

      // Get user stats from Firestore
      const userDocRef = doc(firestore, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.stats || {};
      }

      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchStatsHistory = createAsyncThunk(
  "progress/fetchStatsHistory",
  async (timeframe = "week", { getState, rejectWithValue }) => {
    try {
      const { uid } = getState().auth.user;
      const { items } = getState().habits;

      // Create a date range based on timeframe
      const now = new Date();
      let startDate = new Date();

      if (timeframe === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === "month") {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeframe === "year") {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Generate date strings for each day in the range
      const dateRange = [];
      let currentDate = new Date(startDate);

      while (currentDate <= now) {
        dateRange.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate completion stats for each day
      const statsHistory = dateRange.map((dateStr) => {
        const completedCount = items.reduce((count, habit) => {
          if (habit.progress?.history && habit.progress.history[dateStr]) {
            return count + 1;
          }
          return count;
        }, 0);

        const totalCount = items.reduce((count, habit) => {
          // Check if habit existed on this date
          if (new Date(habit.createdAt) <= new Date(dateStr)) {
            // Check if habit was scheduled for this date based on frequency
            const date = new Date(dateStr);
            const dayOfWeek = date.getDay();

            if (
              habit.frequency.type === "daily" ||
              (habit.frequency.type === "weekly" &&
                habit.frequency.days.includes(dayOfWeek)) ||
              (habit.frequency.type === "custom" &&
                habit.frequency.days.includes(dayOfWeek))
            ) {
              return count + 1;
            }
          }
          return count;
        }, 0);

        return {
          date: dateStr,
          completed: completedCount,
          total: totalCount,
          completionRate:
            totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
        };
      });

      return {
        timeframe,
        stats: statsHistory,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Calculate user's level based on XP points
const calculateLevel = (xpPoints) => {
  return Math.floor(1 + Math.sqrt(xpPoints / 100));
};

// Progress slice
const progressSlice = createSlice({
  name: "progress",
  initialState: {
    streaks: {},
    stats: {
      totalHabitsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      xpPoints: 0,
      level: 1,
    },
    achievements: [],
    statsHistory: {
      timeframe: "week",
      stats: [],
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateXPPoints: (state, action) => {
      state.stats.xpPoints += action.payload;
      state.stats.level = calculateLevel(state.stats.xpPoints);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch achievements
      .addCase(fetchAchievements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.achievements = action.payload;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch user stats
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = {
          ...state.stats,
          ...action.payload,
          // Ensure level is calculated even if not in Firestore
          level: calculateLevel(
            action.payload.xpPoints || state.stats.xpPoints
          ),
        };
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch stats history
      .addCase(fetchStatsHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatsHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.statsHistory = action.payload;
      })
      .addCase(fetchStatsHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateXPPoints } = progressSlice.actions;
export default progressSlice.reducer;

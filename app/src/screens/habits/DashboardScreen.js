import React, { useEffect, useState, useCallback } from "react"; // Import useCallback
import { Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import {
  fetchHabits,
  completeHabit,
  uncompleteHabit, // Import the new action
} from "../../store/slices/habitsSlice";
import { fetchUserStats } from "../../store/slices/progressSlice";
import {
  Container,
  Card,
  Loading,
  AuthErrorModal,
} from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { HabitCard, StreakIndicator } from "../../components/habits";
import ProgressCircle from "../../components/habits/ProgressCircle";
import { theme } from "../../theme";

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showAuthError, setShowAuthError] = useState(false);
  const dispatch = useDispatch();
  const currentTheme = useSelector((state) => state.ui.theme);
  const currentThemeColors =
    currentTheme === "dark" ? theme.colors.darkMode : theme.colors;

  const { user } = useSelector((state) => state.auth);
  const { dailyHabits, loading, error } = useSelector((state) => state.habits);
  const { stats } = useSelector((state) => state.progress);
  const { subscription } = useSelector((state) => state.premium);

  // Check for authentication errors
  useEffect(() => {
    if (error && error.includes("Authentication error")) {
      setShowAuthError(true);
    }
  }, [error]);

  // Fetch data when the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dispatch]) // Add dispatch as a dependency
  );

  useEffect(() => {
    // Initial data load if not already loaded (optional, useFocusEffect handles this)
    // loadData();
  }, []); // Empty dependency array as useFocusEffect handles fetching on focus

  const loadData = async () => {
    dispatch(fetchHabits());
    dispatch(fetchUserStats());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleHabitPress = (habit) => {
    navigation.navigate("HabitDetail", { habit });
  };

  const handleHabitToggle = (habit) => {
    const today = new Date().toISOString().split("T")[0];
    const isCompletedToday =
      habit.progress?.history && habit.progress.history[today];

    if (isCompletedToday) {
      // Dispatch uncomplete action if already completed today
      dispatch(uncompleteHabit({ id: habit.id }));
    } else {
      // Dispatch complete action if not completed today
      dispatch(completeHabit({ id: habit.id }));
    }
  };

  const handleAddHabit = () => {
    navigation.navigate("AddHabit");
  };

  // Calculate completion rate for today
  const calculateTodayProgress = () => {
    if (!dailyHabits || dailyHabits.length === 0) return 0;

    const today = new Date().toISOString().split("T")[0];
    const completedCount = dailyHabits.filter(
      (habit) => habit.progress?.history && habit.progress.history[today]
    ).length;

    return dailyHabits.length > 0 ? completedCount / dailyHabits.length : 0;
  };

  const todayProgress = calculateTodayProgress();
  const formattedDate = format(new Date(), "EEEE, MMMM d");

  if (loading && !refreshing && dailyHabits.length === 0) {
    return <Loading fullScreen text="Loading your habits..." />;
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: currentThemeColors.background },
      ]}
    >
      {/* Authentication Error Modal */}
      <AuthErrorModal
        visible={showAuthError}
        onClose={() => setShowAuthError(false)}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Body style={styles.dateText}>{formattedDate}</Body>
            <Heading>Hello, {user?.displayName || "Friend"}</Heading>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() =>
              navigation.navigate("SettingsTab", { screen: "Profile" })
            }
          >
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons
                  name="person"
                  size={24}
                  color={currentThemeColors.primary}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Card style={styles.progressCard}>
          <View style={styles.progressContent}>
            <View style={styles.statsContainer}>
              <Subheading>Today's Progress</Subheading>
              <Body style={styles.progressText}>
                {Math.round(todayProgress * 100)}% Complete
              </Body>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Caption>Habits</Caption>
                  <Body style={styles.statValue}>{dailyHabits.length}</Body>
                </View>

                <View style={styles.statItem}>
                  <Caption>Completed</Caption>
                  <Body style={styles.statValue}>
                    {
                      dailyHabits.filter((habit) => {
                        const today = new Date().toISOString().split("T")[0];
                        return (
                          habit.progress?.history &&
                          habit.progress.history[today]
                        );
                      }).length
                    }
                  </Body>
                </View>

                <View style={styles.statItem}>
                  <Caption>Current Streak</Caption>
                  <Body style={styles.statValue}>
                    {stats.currentStreak || 0}
                  </Body>
                </View>
              </View>
            </View>

            <View style={styles.circleContainer}>
              <ProgressCircle
                size={80}
                strokeWidth={10}
                progress={todayProgress}
                color={currentThemeColors.primary}
              >
                <Body style={styles.progressPercent}>
                  {Math.round(todayProgress * 100)}%
                </Body>
              </ProgressCircle>
            </View>
          </View>
        </Card>

        <View style={styles.habitSection}>
          <View style={styles.sectionHeader}>
            <Subheading>Today's Habits</Subheading>

            <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
              <Ionicons
                name="add-circle"
                size={24}
                color={currentThemeColors.primary}
              />
              <Body style={styles.addButtonText}>Add</Body>
            </TouchableOpacity>
          </View>

          {dailyHabits.length === 0 ? (
            <Card style={styles.emptyStateCard}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={currentThemeColors.gray}
                style={styles.emptyStateIcon}
              />
              <Body style={styles.emptyStateText}>
                You don't have any habits scheduled for today.
              </Body>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddHabit}
              >
                <Body style={styles.emptyStateButtonText}>
                  Add Your First Habit
                </Body>
              </TouchableOpacity>
            </Card>
          ) : (
            dailyHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onPress={() => handleHabitPress(habit)}
                onToggle={() => handleHabitToggle(habit)}
              />
            ))
          )}
        </View>

        {stats.currentStreak > 0 && (
          <Card style={styles.streakCard}>
            <View style={styles.streakContent}>
              <Ionicons
                name="flame"
                size={24}
                color={currentThemeColors.warning}
              />
              <Body style={styles.streakText}>
                Your streak is on fire! Keep going for {stats.currentStreak}{" "}
                {stats.currentStreak === 1 ? "day" : "days"} now!
              </Body>
            </View>
          </Card>
        )}

        {!subscription.isSubscribed && (
          <Card style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="diamond"
                size={24}
                color={currentThemeColors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>Unlock Premium Features</Body>
                <Caption>
                  Get detailed analytics, AI recommendations, and more!
                </Caption>
              </View>
            </View>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() =>
                navigation.navigate("PremiumTab", { screen: "Subscription" })
              }
            >
              <Body style={styles.premiumButtonText}>Upgrade</Body>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: theme.spacing.medium,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.large,
  },
  dateText: {
    color: theme.colors.darkGray,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileImage: {
    width: 40,
    height: 40,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCard: {
    marginBottom: theme.spacing.medium,
  },
  progressContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsContainer: {
    flex: 1,
  },
  progressText: {
    marginTop: 4,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.small,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: theme.fonts.semiBold,
    marginTop: 4,
  },
  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercent: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fonts.bold,
  },
  habitSection: {
    marginBottom: theme.spacing.large,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    marginLeft: 4,
  },
  emptyStateCard: {
    alignItems: "center",
    padding: theme.spacing.large,
  },
  emptyStateIcon: {
    marginBottom: theme.spacing.medium,
  },
  emptyStateText: {
    textAlign: "center",
    marginBottom: theme.spacing.medium,
  },
  emptyStateButton: {
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
  },
  emptyStateButtonText: {
    fontFamily: theme.fonts.semiBold,
  },
  streakCard: {
    marginBottom: theme.spacing.medium,
  },
  streakContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakText: {
    marginLeft: theme.spacing.small,
    flex: 1,
  },
  premiumCard: {
    marginBottom: theme.spacing.large,
  },
  premiumContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  premiumTextContainer: {
    marginLeft: theme.spacing.small,
    flex: 1,
  },
  premiumTitle: {
    fontFamily: theme.fonts.semiBold,
  },
  premiumButton: {
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    alignItems: "center",
  },
  premiumButtonText: {
    fontFamily: theme.fonts.semiBold,
  },
});

export default DashboardScreen;

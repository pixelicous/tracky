import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart } from "react-native-chart-kit";
import { format, subDays, eachDayOfInterval } from "date-fns";
import {
  fetchUserStats,
  fetchStatsHistory,
  fetchAchievements,
} from "../../store/slices/progressSlice";
import { Card, Container, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { ProgressCircle } from "../../components/habits";
import { theme } from "../../theme";
import { getAchievementIcon } from "../../utils/iconUtils";

const { width } = Dimensions.get("window");
const chartWidth = width - 32; // Accounting for padding

const ProgressDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("week"); // 'week', 'month', 'year'

  const dispatch = useDispatch();
  const { stats, statsHistory, achievements, loading } = useSelector(
    (state) => state.progress
  );
  const { items: habits } = useSelector((state) => state.habits);
  const { subscription } = useSelector((state) => state.premium);

  useEffect(() => {
    loadData();
  }, [selectedTimeframe]);

  const loadData = async () => {
    dispatch(fetchUserStats());
    dispatch(fetchStatsHistory(selectedTimeframe));
    dispatch(fetchAchievements());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate XP to next level
  const calculateXpProgress = () => {
    const currentLevel = stats.level || 1;
    const nextLevelXp = (currentLevel + 1) * (currentLevel + 1) * 100;
    const currentLevelXp = currentLevel * currentLevel * 100;
    const xpNeeded = nextLevelXp - currentLevelXp;
    const xpProgress = (stats.xpPoints - currentLevelXp) / xpNeeded;

    return {
      level: currentLevel,
      nextLevel: currentLevel + 1,
      xpProgress,
      xpCurrent: stats.xpPoints - currentLevelXp,
      xpNeeded,
    };
  };

  // Prepare stats data for charts
  const prepareWeeklyData = () => {
    if (
      !statsHistory ||
      !statsHistory.stats ||
      statsHistory.stats.length === 0
    ) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
      };
    }

    // For week view, only show last 7 days
    const lastSevenDays = statsHistory.stats.slice(-7);

    // Format day labels
    const labels = lastSevenDays.map((day) =>
      format(new Date(day.date), "EEE")
    );
    const data = lastSevenDays.map((day) =>
      Math.round(day.completionRate || 0)
    );

    return {
      labels,
      datasets: [{ data }],
    };
  };

  // Get recent achievements
  const getRecentAchievements = () => {
    if (!achievements || achievements.length === 0) return [];

    // Sort by unlocked date and take most recent 3
    return [...achievements]
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, 3);
  };

  // Calculate habit streaks
  const getTopStreaks = () => {
    if (!habits || habits.length === 0) return [];

    // Get habits with streaks, sort by streak length
    return [...habits]
      .filter((habit) => habit.progress && habit.progress.streak > 0)
      .sort((a, b) => b.progress.streak - a.progress.streak)
      .slice(0, 3);
  };

  // Level progress
  const levelProgress = calculateXpProgress();

  // Chart data
  const weeklyData = prepareWeeklyData();

  // Recent achievements and top streaks
  const recentAchievements = getRecentAchievements();
  const topStreaks = getTopStreaks();

  if (loading && !refreshing && statsHistory.stats.length === 0) {
    return <Loading fullScreen text="Loading your progress..." />;
  }

  return (
    <Container>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Level Progress Card */}
        <Card style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Subheading>Current Level</Subheading>
              <Title style={styles.levelTitle}>{levelProgress.level}</Title>
            </View>

            <ProgressCircle
              size={70}
              strokeWidth={8}
              progress={levelProgress.xpProgress}
              color={theme.colors.primary}
            >
              <Body style={styles.levelProgressText}>
                {Math.round(levelProgress.xpProgress * 100)}%
              </Body>
            </ProgressCircle>
          </View>

          <View style={styles.xpContainer}>
            <Body style={styles.xpText}>
              XP: {levelProgress.xpCurrent} / {levelProgress.xpNeeded}
            </Body>
            <Body style={styles.totalXpText}>
              Total XP: {stats.xpPoints || 0}
            </Body>
          </View>
        </Card>

        {/* Completion Rate Card */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Subheading>Habit Completion Rate</Subheading>

            <View style={styles.timeframeButtons}>
              <TouchableOpacity
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === "week" && styles.selectedTimeframe,
                ]}
                onPress={() => setSelectedTimeframe("week")}
              >
                <Caption
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === "week" &&
                      styles.selectedTimeframeText,
                  ]}
                >
                  Week
                </Caption>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === "month" && styles.selectedTimeframe,
                ]}
                onPress={() => setSelectedTimeframe("month")}
              >
                <Caption
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === "month" &&
                      styles.selectedTimeframeText,
                  ]}
                >
                  Month
                </Caption>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === "year" && styles.selectedTimeframe,
                ]}
                onPress={() => setSelectedTimeframe("year")}
                disabled={!subscription.isSubscribed}
              >
                <Caption
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === "year" &&
                      styles.selectedTimeframeText,
                    !subscription.isSubscribed && styles.disabledTimeframeText,
                  ]}
                >
                  Year {!subscription.isSubscribed && "🔒"}
                </Caption>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <BarChart
              data={weeklyData}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.white,
                backgroundGradientFrom: theme.colors.white,
                backgroundGradientTo: theme.colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(106, 90, 224, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(113, 117, 133, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.7,
                propsForLabels: {
                  fontSize: 12,
                  fontFamily: theme.fonts.medium,
                },
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              yAxisSuffix="%"
            />
          </View>
        </Card>

        {/* Stats Summary Card */}
        <Card style={styles.statsCard}>
          <Subheading style={styles.statsTitle}>Stats Summary</Subheading>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: `${theme.colors.primary}20` },
                ]}
              >
                <Ionicons
                  name="checkbox"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Body style={styles.statValue}>
                {stats.totalHabitsCompleted || 0}
              </Body>
              <Caption style={styles.statLabel}>Completed</Caption>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: `${theme.colors.warning}20` },
                ]}
              >
                <Ionicons name="flame" size={20} color={theme.colors.warning} />
              </View>
              <Body style={styles.statValue}>{stats.currentStreak || 0}</Body>
              <Caption style={styles.statLabel}>Current Streak</Caption>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: `${theme.colors.tertiary}20` },
                ]}
              >
                <Ionicons
                  name="trophy"
                  size={20}
                  color={theme.colors.tertiary}
                />
              </View>
              <Body style={styles.statValue}>{stats.longestStreak || 0}</Body>
              <Caption style={styles.statLabel}>Best Streak</Caption>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: `${theme.colors.secondary}20` },
                ]}
              >
                <Ionicons
                  name="list"
                  size={20}
                  color={theme.colors.secondary}
                />
              </View>
              <Body style={styles.statValue}>{habits.length || 0}</Body>
              <Caption style={styles.statLabel}>Total Habits</Caption>
            </View>
          </View>
        </Card>

        {/* Recent Achievements Card */}
        <Card style={styles.achievementsCard}>
          <View style={styles.cardHeader}>
            <Subheading>Recent Achievements</Subheading>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("Achievements")}
            >
              <Caption style={styles.viewAllText}>View All</Caption>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {recentAchievements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="trophy-outline"
                size={40}
                color={theme.colors.gray}
              />
              <Body style={styles.emptyText}>
                Complete habits to earn achievements
              </Body>
            </View>
          ) : (
            recentAchievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: `${theme.colors.warning}20` },
                  ]}
                >
                  {getAchievementIcon(
                    achievement.type,
                    24,
                    theme.colors.warning
                  )}
                </View>

                <View style={styles.achievementInfo}>
                  <Body style={styles.achievementTitle}>
                    {achievement.title}
                  </Body>
                  <Caption>{achievement.description}</Caption>
                </View>

                <View style={styles.achievementXp}>
                  <Body style={styles.xpValue}>
                    +{achievement.xpAwarded} XP
                  </Body>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Top Streaks Card */}
        <Card style={styles.streaksCard}>
          <Subheading style={styles.streaksTitle}>Top Streaks</Subheading>

          {topStreaks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="flame-outline"
                size={40}
                color={theme.colors.gray}
              />
              <Body style={styles.emptyText}>
                Build streaks by completing habits consistently
              </Body>
            </View>
          ) : (
            topStreaks.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.streakItem}
                onPress={() => navigation.navigate("HabitDetail", { habit })}
              >
                <View
                  style={[
                    styles.streakIcon,
                    {
                      backgroundColor: `${
                        habit.color || theme.colors.primary
                      }20`,
                    },
                  ]}
                >
                  <Ionicons
                    name={habit.icon || "checkmark-circle"}
                    size={20}
                    color={habit.color || theme.colors.primary}
                  />
                </View>

                <View style={styles.streakInfo}>
                  <Body numberOfLines={1} style={styles.streakTitle}>
                    {habit.title}
                  </Body>
                </View>

                <View style={styles.streakValue}>
                  <Ionicons
                    name="flame"
                    size={16}
                    color={theme.colors.warning}
                  />
                  <Body style={styles.streakNumber}>
                    {habit.progress.streak}
                  </Body>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card>

        {/* Premium Card (if not subscribed) */}
        {!subscription.isSubscribed && (
          <Card style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="analytics"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>
                  Unlock Advanced Analytics
                </Body>
                <Caption>
                  Get detailed insights, yearly trends, and more!
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
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  levelCard: {
    marginBottom: theme.spacing.medium,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  levelTitle: {
    marginVertical: 0,
  },
  levelProgressText: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fonts.bold,
  },
  xpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: theme.spacing.medium,
  },
  xpText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  totalXpText: {
    color: theme.colors.darkGray,
  },
  chartCard: {
    marginBottom: theme.spacing.medium,
    padding: theme.spacing.medium,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  timeframeButtons: {
    flexDirection: "row",
  },
  timeframeButton: {
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 4,
    marginLeft: 4,
    borderRadius: theme.borderRadius.small,
  },
  timeframeText: {
    color: theme.colors.darkGray,
  },
  selectedTimeframe: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  selectedTimeframeText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  disabledTimeframeText: {
    color: theme.colors.gray,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: theme.borderRadius.medium,
  },
  statsCard: {
    marginBottom: theme.spacing.medium,
  },
  statsTitle: {
    marginBottom: theme.spacing.medium,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    alignItems: "center",
    ...theme.shadows.small,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  statValue: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.bold,
    marginBottom: 4,
  },
  statLabel: {
    textAlign: "center",
  },
  achievementsCard: {
    marginBottom: theme.spacing.medium,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.large,
  },
  emptyText: {
    color: theme.colors.darkGray,
    textAlign: "center",
    marginTop: theme.spacing.small,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: theme.fonts.semiBold,
  },
  achievementXp: {
    backgroundColor: `${theme.colors.primary}10`,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
  },
  xpValue: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fonts.semiBold,
  },
  streaksCard: {
    marginBottom: theme.spacing.medium,
  },
  streaksTitle: {
    marginBottom: theme.spacing.medium,
  },
  streakItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.small,
    paddingVertical: theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  streakIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontFamily: theme.fonts.medium,
  },
  streakValue: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.warning}10`,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  streakNumber: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.warning,
    marginLeft: 4,
  },
  premiumCard: {
    backgroundColor: `${theme.colors.secondary}10`,
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
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    alignItems: "center",
  },
  premiumButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
  },
});

export default ProgressDashboardScreen;

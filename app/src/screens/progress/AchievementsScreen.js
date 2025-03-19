import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { fetchAchievements } from "../../store/slices/progressSlice";
import { Container, Card, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { getAchievementIcon } from "../../utils/iconUtils";
import { theme } from "../../theme";

// Achievement categories for filtering
const ACHIEVEMENT_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "streak", label: "Streaks" },
  { id: "completion", label: "Completion" },
  { id: "variety", label: "Variety" },
  { id: "social", label: "Social" },
  { id: "challenge", label: "Challenges" },
  { id: "special", label: "Special" },
];

// Placeholder achievements for locked/upcoming achievements
const PLACEHOLDER_ACHIEVEMENTS = [
  {
    id: "locked-1",
    type: "streak",
    title: "First Week Streak",
    description: "Complete a habit for 7 days in a row",
    xpAwarded: 50,
    locked: true,
  },
  {
    id: "locked-2",
    type: "streak",
    title: "Two Week Warrior",
    description: "Complete a habit for 14 days in a row",
    xpAwarded: 100,
    locked: true,
  },
  {
    id: "locked-3",
    type: "completion",
    title: "Perfect Day",
    description: "Complete all scheduled habits in a single day",
    xpAwarded: 25,
    locked: true,
  },
  {
    id: "locked-4",
    type: "variety",
    title: "Habit Collector",
    description: "Create 5 different habits",
    xpAwarded: 30,
    locked: true,
  },
  {
    id: "locked-5",
    type: "social",
    title: "Social Circle",
    description: "Add 3 friends to your accountability network",
    xpAwarded: 40,
    locked: true,
  },
  {
    id: "locked-6",
    type: "challenge",
    title: "Challenge Accepted",
    description: "Complete your first challenge",
    xpAwarded: 50,
    locked: true,
  },
];

const AchievementsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const dispatch = useDispatch();
  const { achievements, loading } = useSelector((state) => state.progress);
  const { subscription } = useSelector((state) => state.premium);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    dispatch(fetchAchievements());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAchievements());
    setRefreshing(false);
  };

  // Filter achievements by category
  const getFilteredAchievements = () => {
    let filtered = [...achievements];

    // Filter by category if not "all"
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (achievement) => achievement.type === selectedCategory
      );
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));

    // Add placeholder locked achievements
    const lockedAchievements = PLACEHOLDER_ACHIEVEMENTS.filter((a) => {
      // Filter by category
      if (selectedCategory !== "all" && a.type !== selectedCategory) {
        return false;
      }

      // Check if this achievement is already unlocked
      return !achievements.find(
        (unlocked) =>
          unlocked.title === a.title || unlocked.description === a.description
      );
    });

    return [...filtered, ...lockedAchievements];
  };

  const renderAchievementItem = ({ item }) => (
    <Card style={styles.achievementCard}>
      <View style={styles.achievementContent}>
        <View
          style={[
            styles.achievementIcon,
            {
              backgroundColor: item.locked
                ? theme.colors.lightGray
                : `${theme.colors.warning}20`,
            },
          ]}
        >
          {item.locked ? (
            <Ionicons name="lock-closed" size={24} color={theme.colors.gray} />
          ) : (
            getAchievementIcon(item.type, 24, theme.colors.warning)
          )}
        </View>

        <View style={styles.achievementInfo}>
          <Body
            style={[styles.achievementTitle, item.locked && styles.lockedTitle]}
          >
            {item.title}
          </Body>

          <Caption style={item.locked && styles.lockedText}>
            {item.description}
          </Caption>

          {!item.locked && item.unlockedAt && (
            <Caption style={styles.dateText}>
              Unlocked on {new Date(item.unlockedAt).toLocaleDateString()}
            </Caption>
          )}
        </View>
      </View>

      <View style={[styles.xpBadge, item.locked && styles.lockedXpBadge]}>
        <Body style={[styles.xpText, item.locked && styles.lockedXpText]}>
          +{item.xpAwarded} XP
        </Body>
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color={theme.colors.gray} />
      <Body style={styles.emptyText}>
        No achievements in this category yet. Complete habits to earn
        achievements!
      </Body>
    </View>
  );

  if (loading && !refreshing && achievements.length === 0) {
    return <Loading fullScreen text="Loading achievements..." />;
  }

  const filteredAchievements = getFilteredAchievements();

  return (
    <Container>
      <View style={styles.container}>
        {/* Category Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            data={ACHIEVEMENT_CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedCategory === item.id && styles.selectedFilter,
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Body
                  style={[
                    styles.filterText,
                    selectedCategory === item.id && styles.selectedFilterText,
                  ]}
                >
                  {item.label}
                </Body>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        {/* Achievements List */}
        <FlatList
          data={filteredAchievements}
          renderItem={renderAchievementItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.achievementsList}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />

        {/* Premium Banner (if not subscribed) */}
        {!subscription.isSubscribed && (
          <Card style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="trophy"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>
                  Unlock Premium Achievements
                </Body>
                <Caption>
                  Get access to exclusive achievements and earn more XP!
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
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    marginBottom: theme.spacing.medium,
  },
  filtersList: {
    paddingVertical: theme.spacing.small,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    marginRight: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.lightGray,
  },
  filterText: {
    color: theme.colors.darkGray,
  },
  selectedFilter: {
    backgroundColor: theme.colors.primary,
  },
  selectedFilterText: {
    color: theme.colors.white,
  },
  achievementsList: {
    paddingBottom: theme.spacing.xxl,
  },
  achievementCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  achievementContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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
    marginBottom: 2,
  },
  dateText: {
    marginTop: 4,
    color: theme.colors.darkGray,
    fontSize: theme.fontSizes.xs,
  },
  xpBadge: {
    backgroundColor: `${theme.colors.primary}10`,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.medium,
    marginLeft: theme.spacing.small,
  },
  xpText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fonts.semiBold,
  },
  lockedTitle: {
    color: theme.colors.darkGray,
  },
  lockedText: {
    color: theme.colors.gray,
  },
  lockedXpBadge: {
    backgroundColor: theme.colors.lightGray,
  },
  lockedXpText: {
    color: theme.colors.darkGray,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xxl,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginTop: theme.spacing.medium,
  },
  premiumCard: {
    backgroundColor: `${theme.colors.secondary}10`,
    marginTop: theme.spacing.medium,
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

export default AchievementsScreen;

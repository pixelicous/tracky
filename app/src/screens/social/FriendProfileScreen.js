import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "../../services/api/firebase";
import { removeFriend } from "../../store/slices/socialSlice";
import { Card, Container, Button, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { ProgressCircle, StreakIndicator } from "../../components/habits";
import { theme } from "../../theme";

const FriendProfileScreen = ({ navigation, route }) => {
  const { friend } = route.params;

  const [loading, setLoading] = useState(true);
  const [friendData, setFriendData] = useState(null);
  const [friendHabits, setFriendHabits] = useState([]);
  const [friendAchievements, setFriendAchievements] = useState([]);

  const dispatch = useDispatch();
  const { subscription } = useSelector((state) => state.premium);

  // Load friend's profile data
  useEffect(() => {
    loadFriendData();

    // Set navigation options
    navigation.setOptions({
      headerTitle: friend?.displayName || "Friend",
      headerRight: () => (
        <TouchableOpacity style={styles.moreButton} onPress={showOptions}>
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={theme.colors.black}
          />
        </TouchableOpacity>
      ),
    });
  }, [friend?.id]);

  const loadFriendData = async () => {
    setLoading(true);

    try {
      // Get latest friend data
      const friendDoc = await getDoc(doc(firestore, "users", friend.id));
      if (friendDoc.exists()) {
        setFriendData(friendDoc.data());
      }

      // Get friend's public habits
      // Note: In a real app, you'd have privacy settings to control what habits are shared
      const habitsQuery = query(
        collection(firestore, "habits"),
        where("userId", "==", friend.id),
        where("isArchived", "==", false),
        where("isPublic", "==", true), // Assuming habits have privacy settings
        orderBy("createdAt", "desc")
      );

      const habitsSnapshot = await getDocs(habitsQuery);
      const habits = [];

      habitsSnapshot.forEach((doc) => {
        habits.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setFriendHabits(habits);

      // Get friend's achievements
      const achievementsQuery = query(
        collection(firestore, "achievements"),
        where("userId", "==", friend.id),
        where("isPublic", "==", true), // Assuming achievements have privacy settings
        orderBy("unlockedAt", "desc")
      );

      const achievementsSnapshot = await getDocs(achievementsQuery);
      const achievements = [];

      achievementsSnapshot.forEach((doc) => {
        achievements.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setFriendAchievements(achievements);
    } catch (error) {
      console.error("Error loading friend data:", error);
      Alert.alert("Error", "Failed to load friend data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show options menu
  const showOptions = () => {
    Alert.alert(
      "Friend Options",
      `What would you like to do with ${friend.displayName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove Friend",
          style: "destructive",
          onPress: confirmRemoveFriend,
        },
        {
          text: "Challenge",
          onPress: () =>
            navigation.navigate("CreateChallenge", { friendId: friend.id }),
        },
      ]
    );
  };

  // Confirm remove friend
  const confirmRemoveFriend = () => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friend.displayName} from your friends?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: handleRemoveFriend,
        },
      ]
    );
  };

  // Handle remove friend
  const handleRemoveFriend = () => {
    dispatch(removeFriend(friend.id))
      .unwrap()
      .then(() => {
        navigation.goBack();
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to remove friend. Please try again.");
      });
  };

  // Calculate completion rate
  const calculateCompletionRate = () => {
    if (!friendData || !friendData.stats) return 0;

    const { totalHabitsCompleted, totalHabitsScheduled } = friendData.stats;

    if (!totalHabitsScheduled || totalHabitsScheduled === 0) return 0;

    return Math.min(1, totalHabitsCompleted / totalHabitsScheduled);
  };

  if (loading) {
    return <Loading fullScreen text="Loading profile..." />;
  }

  const completionRate = calculateCompletionRate();
  const friendStats = friendData?.stats || {
    currentStreak: 0,
    longestStreak: 0,
    totalHabitsCompleted: 0,
    level: 1,
    xpPoints: 0,
  };

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {friend.photoURL ? (
              <Image
                source={{ uri: friend.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons
                  name="person"
                  size={40}
                  color={theme.colors.primary}
                />
              </View>
            )}
          </View>

          <Title style={styles.profileName}>{friend.displayName}</Title>

          <View style={styles.levelBadge}>
            <Caption style={styles.levelText}>
              Level {friendStats.level}
            </Caption>
          </View>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Subheading>Stats</Subheading>

            <ProgressCircle
              size={60}
              strokeWidth={8}
              progress={completionRate}
              color={theme.colors.primary}
            >
              <Body style={styles.progressText}>
                {Math.round(completionRate * 100)}%
              </Body>
            </ProgressCircle>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Body style={styles.statValue}>{friendStats.currentStreak}</Body>
              <Caption style={styles.statLabel}>Current Streak</Caption>
            </View>

            <View style={styles.statItem}>
              <Body style={styles.statValue}>{friendStats.longestStreak}</Body>
              <Caption style={styles.statLabel}>Best Streak</Caption>
            </View>

            <View style={styles.statItem}>
              <Body style={styles.statValue}>
                {friendStats.totalHabitsCompleted}
              </Body>
              <Caption style={styles.statLabel}>Habits Completed</Caption>
            </View>

            <View style={styles.statItem}>
              <Body style={styles.statValue}>{friendHabits.length}</Body>
              <Caption style={styles.statLabel}>Active Habits</Caption>
            </View>
          </View>
        </Card>

        {/* Friend's Habits */}
        <Card style={styles.habitsCard}>
          <View style={styles.sectionHeader}>
            <Subheading>Habits</Subheading>
            {friendHabits.length > 0 && (
              <Caption>{friendHabits.length} habits</Caption>
            )}
          </View>

          {friendHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list" size={40} color={theme.colors.gray} />
              <Body style={styles.emptyStateText}>
                No shared habits available
              </Body>
            </View>
          ) : (
            <View style={styles.habitsList}>
              {friendHabits.slice(0, 3).map((habit) => (
                <View key={habit.id} style={styles.habitItem}>
                  <View
                    style={[
                      styles.habitIcon,
                      {
                        backgroundColor: `${
                          habit.color || theme.colors.primary
                        }20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={habit.icon || "checkmark-circle"}
                      size={24}
                      color={habit.color || theme.colors.primary}
                    />
                  </View>

                  <View style={styles.habitInfo}>
                    <Body style={styles.habitTitle}>{habit.title}</Body>

                    <View style={styles.habitMeta}>
                      {habit.progress?.streak > 0 && (
                        <StreakIndicator
                          count={habit.progress.streak}
                          size="small"
                        />
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {friendHabits.length > 3 && (
                <Body style={styles.moreLabel}>
                  +{friendHabits.length - 3} more habits
                </Body>
              )}
            </View>
          )}
        </Card>

        {/* Recent Achievements */}
        <Card style={styles.achievementsCard}>
          <Subheading style={styles.achievementsTitle}>
            Recent Achievements
          </Subheading>

          {friendAchievements.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy" size={40} color={theme.colors.gray} />
              <Body style={styles.emptyStateText}>No achievements to show</Body>
            </View>
          ) : (
            <View style={styles.achievementsList}>
              {friendAchievements.slice(0, 3).map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View
                    style={[
                      styles.achievementIcon,
                      { backgroundColor: `${theme.colors.warning}20` },
                    ]}
                  >
                    <Ionicons
                      name={achievement.icon || "trophy"}
                      size={24}
                      color={theme.colors.warning}
                    />
                  </View>

                  <View style={styles.achievementInfo}>
                    <Body style={styles.achievementTitle}>
                      {achievement.title}
                    </Body>
                    <Caption>{achievement.description}</Caption>

                    {achievement.unlockedAt && (
                      <Caption style={styles.achievementDate}>
                        Earned on{" "}
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </Caption>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Challenge Button */}
        <Button
          title="Challenge Friend"
          onPress={() =>
            navigation.navigate("CreateChallenge", { friendId: friend.id })
          }
          icon={<Ionicons name="trophy" size={20} color={theme.colors.white} />}
          iconPosition="left"
          style={styles.challengeButton}
          fullWidth
        />

        {/* Compare Stats - Premium Feature */}
        {subscription.isSubscribed ? (
          <Card style={styles.compareCard}>
            <Subheading style={styles.compareTitle}>
              Stats Comparison
            </Subheading>

            <View style={styles.comparisonItem}>
              <View style={styles.comparisonLabels}>
                <Body style={styles.comparisonLabel}>Completion Rate</Body>
              </View>

              <View style={styles.comparisonBars}>
                <View style={styles.comparisonYou}>
                  <View
                    style={[
                      styles.comparisonBar,
                      styles.yourBar,
                      { width: `${85}%` },
                    ]}
                  />
                  <Caption style={styles.comparisonValue}>85%</Caption>
                </View>

                <View style={styles.comparisonFriend}>
                  <View
                    style={[
                      styles.comparisonBar,
                      styles.friendBar,
                      { width: `${Math.round(completionRate * 100)}%` },
                    ]}
                  />
                  <Caption style={styles.comparisonValue}>
                    {Math.round(completionRate * 100)}%
                  </Caption>
                </View>
              </View>
            </View>

            <View style={styles.comparisonItem}>
              <View style={styles.comparisonLabels}>
                <Body style={styles.comparisonLabel}>Current Streak</Body>
              </View>

              <View style={styles.comparisonBars}>
                <View style={styles.comparisonYou}>
                  <Body style={styles.comparisonText}>12 days</Body>
                </View>

                <View style={styles.comparisonFriend}>
                  <Body style={styles.comparisonText}>
                    {friendStats.currentStreak} days
                  </Body>
                </View>
              </View>
            </View>

            <View style={styles.comparisonItem}>
              <View style={styles.comparisonLabels}>
                <Body style={styles.comparisonLabel}>Habits Completed</Body>
              </View>

              <View style={styles.comparisonBars}>
                <View style={styles.comparisonYou}>
                  <Body style={styles.comparisonText}>156</Body>
                </View>

                <View style={styles.comparisonFriend}>
                  <Body style={styles.comparisonText}>
                    {friendStats.totalHabitsCompleted}
                  </Body>
                </View>
              </View>
            </View>

            <View style={styles.comparisonLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.yourDot]} />
                <Caption>You</Caption>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.friendDot]} />
                <Caption>{friend.displayName}</Caption>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="analytics"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>Unlock Stats Comparison</Body>
                <Caption>See how your habits compare to your friend's</Caption>
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
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxl,
  },
  moreButton: {
    padding: 8,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: theme.spacing.large,
  },
  profileImageContainer: {
    marginBottom: theme.spacing.medium,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    marginBottom: theme.spacing.xs,
  },
  levelBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
  },
  levelText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.medium,
  },
  statsCard: {
    marginBottom: theme.spacing.medium,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  progressText: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fonts.bold,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    alignItems: "center",
  },
  statValue: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.xl,
    marginBottom: 4,
  },
  statLabel: {
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  habitsCard: {
    marginBottom: theme.spacing.medium,
  },
  habitsList: {
    marginBottom: theme.spacing.small,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.small,
    paddingBottom: theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontFamily: theme.fonts.medium,
    marginBottom: 4,
  },
  habitMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  moreLabel: {
    color: theme.colors.darkGray,
    textAlign: "center",
    marginTop: theme.spacing.small,
  },
  emptyState: {
    alignItems: "center",
    padding: theme.spacing.large,
  },
  emptyStateText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginTop: theme.spacing.small,
  },
  achievementsCard: {
    marginBottom: theme.spacing.medium,
  },
  achievementsTitle: {
    marginBottom: theme.spacing.medium,
  },
  achievementsList: {
    marginBottom: theme.spacing.small,
  },
  achievementItem: {
    flexDirection: "row",
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
    marginBottom: 2,
  },
  achievementDate: {
    marginTop: 4,
    color: theme.colors.darkGray,
    fontSize: theme.fontSizes.xs,
  },
  challengeButton: {
    marginBottom: theme.spacing.large,
  },
  compareCard: {
    marginBottom: theme.spacing.large,
  },
  compareTitle: {
    marginBottom: theme.spacing.medium,
  },
  comparisonItem: {
    marginBottom: theme.spacing.medium,
  },
  comparisonLabels: {
    marginBottom: theme.spacing.small,
  },
  comparisonLabel: {
    fontFamily: theme.fonts.medium,
  },
  comparisonBars: {
    marginBottom: theme.spacing.small,
  },
  comparisonYou: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  comparisonFriend: {
    flexDirection: "row",
    alignItems: "center",
  },
  comparisonBar: {
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.small,
  },
  yourBar: {
    backgroundColor: theme.colors.primary,
  },
  friendBar: {
    backgroundColor: theme.colors.secondary,
  },
  comparisonValue: {
    flex: 1,
  },
  comparisonText: {
    flex: 1,
  },
  comparisonLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.small,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.medium,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },
  yourDot: {
    backgroundColor: theme.colors.primary,
  },
  friendDot: {
    backgroundColor: theme.colors.secondary,
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

export default FriendProfileScreen;

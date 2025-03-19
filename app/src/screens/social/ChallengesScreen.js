import React, { useState, useEffect } from "react";
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
import { fetchChallenges } from "../../store/slices/socialSlice";
import { Container, Card, Button, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const ChallengesScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("active"); // 'active', 'completed', 'upcoming'

  const dispatch = useDispatch();
  const { challenges, loading } = useSelector((state) => state.social);
  const { user } = useSelector((state) => state.auth);
  const { subscription } = useSelector((state) => state.premium);

  useEffect(() => {
    loadData();

    // Set navigation header button
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateChallenge")}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, []);

  const loadData = () => {
    dispatch(fetchChallenges());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchChallenges());
    setRefreshing(false);
  };

  // Filter challenges based on status
  const filterChallenges = () => {
    if (!challenges) return [];

    const now = new Date();

    return challenges.filter((challenge) => {
      const startDate = new Date(challenge.startDate);
      const endDate = new Date(challenge.endDate);

      // Get user's progress
      const userProgress = challenge.participants.find(
        (p) => p.userId === user.uid
      );
      const isCompleted = userProgress?.completed || false;

      if (filterType === "active") {
        return startDate <= now && endDate >= now && !isCompleted;
      } else if (filterType === "completed") {
        return isCompleted || endDate < now;
      } else if (filterType === "upcoming") {
        return startDate > now;
      }

      return true;
    });
  };

  // Render challenge item
  const renderChallengeItem = ({ item }) => {
    // Calculate days remaining or days ago
    const now = new Date();
    const endDate = new Date(item.endDate);
    const daysDiff = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));

    // Get user's progress
    const userProgress = item.participants.find((p) => p.userId === user.uid);
    const progress = userProgress?.progress || 0;
    const isCompleted = userProgress?.completed || false;

    // Generate status text
    let statusText = "";
    let statusColor = "";

    if (isCompleted) {
      statusText = "Completed";
      statusColor = theme.colors.success;
    } else if (new Date(item.startDate) > now) {
      statusText = "Upcoming";
      statusColor = theme.colors.info;
    } else if (endDate < now) {
      statusText = "Expired";
      statusColor = theme.colors.error;
    } else if (daysDiff === 0) {
      statusText = "Last day";
      statusColor = theme.colors.warning;
    } else {
      statusText = `${daysDiff} ${daysDiff === 1 ? "day" : "days"} left`;
      statusColor = theme.colors.primary;
    }

    return (
      <TouchableOpacity
        style={styles.challengeItem}
        onPress={() =>
          navigation.navigate("ChallengeDetail", { challenge: item })
        }
      >
        <View style={styles.challengeHeader}>
          <View style={styles.challengeTitleContainer}>
            <View
              style={[
                styles.challengeIcon,
                { backgroundColor: `${theme.colors.primary}20` },
              ]}
            >
              <Ionicons
                name={item.icon || "trophy"}
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.challengeInfo}>
              <Body style={styles.challengeTitle}>{item.title}</Body>

              <View style={styles.challengeMeta}>
                <Caption>
                  {item.participants.length}{" "}
                  {item.participants.length === 1
                    ? "participant"
                    : "participants"}
                </Caption>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${statusColor}20` },
                  ]}
                >
                  <Caption style={[styles.statusText, { color: statusColor }]}>
                    {statusText}
                  </Caption>
                </View>
              </View>
            </View>
          </View>

          {item.type === "personal" ? (
            <View style={styles.typeBadge}>
              <Caption style={styles.typeText}>Personal</Caption>
            </View>
          ) : (
            <View style={styles.participantsAvatars}>
              {item.participants.slice(0, 3).map((participant, index) => (
                <View
                  key={participant.userId}
                  style={[
                    styles.participantAvatar,
                    { zIndex: 3 - index, right: index * 10 },
                  ]}
                >
                  {participant.photoURL ? (
                    <Image
                      source={{ uri: participant.photoURL }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons
                        name="person"
                        size={12}
                        color={theme.colors.primary}
                      />
                    </View>
                  )}
                </View>
              ))}

              {item.participants.length > 3 && (
                <View
                  style={[
                    styles.participantAvatar,
                    styles.moreParticipants,
                    { right: 3 * 10 },
                  ]}
                >
                  <Caption style={styles.moreText}>
                    +{item.participants.length - 3}
                  </Caption>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.challengeBody}>
          <Caption style={styles.challengeDescription} numberOfLines={2}>
            {item.description || "Complete daily challenges to win!"}
          </Caption>

          <View style={styles.progressContainer}>
            <Caption>Your progress:</Caption>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Caption style={styles.progressText}>{progress}%</Caption>
            </View>
          </View>

          <View style={styles.rewardsContainer}>
            <Caption style={styles.rewardsLabel}>Rewards:</Caption>

            <View style={styles.rewardsList}>
              {item.rewards?.xp && (
                <View style={styles.rewardItem}>
                  <Ionicons
                    name="star"
                    size={16}
                    color={theme.colors.warning}
                  />
                  <Caption style={styles.rewardText}>
                    {item.rewards.xp} XP
                  </Caption>
                </View>
              )}

              {item.rewards?.streak && (
                <View style={styles.rewardItem}>
                  <Ionicons
                    name="flame"
                    size={16}
                    color={theme.colors.warning}
                  />
                  <Caption style={styles.rewardText}>
                    +{item.rewards.streak} Streak Saver
                  </Caption>
                </View>
              )}

              {item.rewards?.badge && (
                <View style={styles.rewardItem}>
                  <Ionicons
                    name="ribbon"
                    size={16}
                    color={theme.colors.warning}
                  />
                  <Caption style={styles.rewardText}>Special Badge</Caption>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy" size={48} color={theme.colors.gray} />
      <Body style={styles.emptyStateText}>
        {filterType === "active" &&
          "No active challenges found. Create a new challenge to get started!"}
        {filterType === "completed" &&
          "You haven't completed any challenges yet."}
        {filterType === "upcoming" &&
          "No upcoming challenges found. Plan your next challenge!"}
      </Body>

      <Button
        title="Create Challenge"
        onPress={() => navigation.navigate("CreateChallenge")}
        style={styles.emptyStateButton}
      />
    </View>
  );

  // Get filtered challenges
  const filteredChallenges = filterChallenges();

  // Loading state
  if (loading && !refreshing && challenges.length === 0) {
    return <Loading fullScreen text="Loading challenges..." />;
  }

  return (
    <Container>
      <View style={styles.container}>
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === "active" && styles.activeFilterTab,
            ]}
            onPress={() => setFilterType("active")}
          >
            <Body
              style={[
                styles.filterText,
                filterType === "active" && styles.activeFilterText,
              ]}
            >
              Active
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === "completed" && styles.activeFilterTab,
            ]}
            onPress={() => setFilterType("completed")}
          >
            <Body
              style={[
                styles.filterText,
                filterType === "completed" && styles.activeFilterText,
              ]}
            >
              Completed
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === "upcoming" && styles.activeFilterTab,
            ]}
            onPress={() => setFilterType("upcoming")}
          >
            <Body
              style={[
                styles.filterText,
                filterType === "upcoming" && styles.activeFilterText,
              ]}
            >
              Upcoming
            </Body>
          </TouchableOpacity>
        </View>

        {/* Challenges List */}
        <FlatList
          data={filteredChallenges}
          renderItem={renderChallengeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CreateChallenge")}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>

        {/* Premium Leaderboard Banner - Only shown for free users */}
        {!subscription.isSubscribed && (
          <Card style={styles.premiumBanner}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="podium"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>Challenge Leaderboards</Body>
                <Caption>
                  Upgrade to premium to see global challenge rankings
                </Caption>
              </View>

              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() =>
                  navigation.navigate("PremiumTab", { screen: "Subscription" })
                }
              >
                <Caption style={styles.premiumButtonText}>Upgrade</Caption>
              </TouchableOpacity>
            </View>
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
  createButton: {
    padding: 10,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.lightGray,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    alignItems: "center",
    borderRadius: theme.borderRadius.small,
  },
  activeFilterTab: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.small,
  },
  filterText: {
    color: theme.colors.darkGray,
  },
  activeFilterText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  challengeItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    ...theme.shadows.small,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.small,
  },
  challengeTitleContainer: {
    flexDirection: "row",
    flex: 1,
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.small,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontFamily: theme.fonts.semiBold,
    marginBottom: 4,
  },
  challengeMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.small,
  },
  statusText: {
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.medium,
  },
  typeBadge: {
    backgroundColor: `${theme.colors.tertiary}20`,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.small,
  },
  typeText: {
    color: theme.colors.tertiary,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.medium,
  },
  participantsAvatars: {
    flexDirection: "row",
    marginLeft: theme.spacing.small,
  },
  participantAvatar: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  avatarImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  avatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  moreParticipants: {
    backgroundColor: theme.colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.darkGray,
  },
  challengeBody: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: theme.spacing.small,
  },
  challengeDescription: {
    marginBottom: theme.spacing.small,
  },
  progressContainer: {
    marginBottom: theme.spacing.small,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 3,
    marginRight: theme.spacing.small,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    width: 40,
    textAlign: "right",
  },
  rewardsContainer: {
    marginTop: theme.spacing.small,
  },
  rewardsLabel: {
    marginBottom: 4,
  },
  rewardsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.warning}10`,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    marginRight: theme.spacing.small,
    marginBottom: 4,
  },
  rewardText: {
    marginLeft: 4,
    color: theme.colors.darkGray,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xxl,
  },
  emptyStateText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginVertical: theme.spacing.medium,
  },
  emptyStateButton: {
    minWidth: 200,
  },
  fab: {
    position: "absolute",
    right: theme.spacing.medium,
    bottom: theme.spacing.large,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.medium,
  },
  premiumBanner: {
    marginTop: "auto",
    marginBottom: theme.spacing.medium,
    backgroundColor: `${theme.colors.secondary}10`,
  },
  premiumContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.small,
  },
  premiumTitle: {
    fontFamily: theme.fonts.semiBold,
  },
  premiumButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
  },
  premiumButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.medium,
  },
});

export default ChallengesScreen;

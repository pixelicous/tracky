import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchFriends,
  fetchFriendRequests,
  fetchChallenges,
} from "../../store/slices/socialSlice";
import { Card, Container, Button, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const SocialDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch();
  const { friends, requests, challenges, loading } = useSelector(
    (state) => state.social
  );
  const { subscription } = useSelector((state) => state.premium);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    dispatch(fetchFriends());
    dispatch(fetchFriendRequests());
    dispatch(fetchChallenges());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchFriends()),
      dispatch(fetchFriendRequests()),
      dispatch(fetchChallenges()),
    ]);
    setRefreshing(false);
  };

  // Functions for navigation
  const goToFriendsList = () => {
    navigation.navigate("Friends");
  };

  const goToAddFriend = () => {
    navigation.navigate("AddFriend");
  };

  const goToChallenges = () => {
    navigation.navigate("Challenges");
  };

  const goToCreateChallenge = () => {
    navigation.navigate("CreateChallenge");
  };

  const goToFriendProfile = (friend) => {
    navigation.navigate("FriendProfile", { friend });
  };

  const goToChallengeDetail = (challenge) => {
    navigation.navigate("ChallengeDetail", { challenge });
  };

  const renderFriendItem = (friend, index) => (
    <TouchableOpacity
      key={friend.id}
      style={styles.friendItem}
      onPress={() => goToFriendProfile(friend)}
    >
      <View style={styles.friendAvatar}>
        {friend.photoURL ? (
          <Image source={{ uri: friend.photoURL }} style={styles.friendImage} />
        ) : (
          <View style={styles.friendPlaceholder}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
          </View>
        )}
      </View>
      <Caption style={styles.friendName} numberOfLines={1}>
        {friend.displayName}
      </Caption>
    </TouchableOpacity>
  );

  // Simplified challenge list item
  const renderChallengeItem = (challenge) => {
    // Calculate progress percentage
    const userProgress =
      challenge.participants.find((p) => p.userId === user.uid)?.progress || 0;
    const progressPercentage = Math.min(100, Math.max(0, userProgress));

    return (
      <TouchableOpacity
        key={challenge.id}
        style={styles.challengeItem}
        onPress={() => goToChallengeDetail(challenge)}
      >
        <View style={styles.challengeIconContainer}>
          <Ionicons
            name={challenge.icon || "trophy"}
            size={24}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.challengeContent}>
          <Body style={styles.challengeTitle} numberOfLines={1}>
            {challenge.title}
          </Body>

          <Caption style={styles.challengeInfo}>
            {challenge.participants.length} participants • Ends{" "}
            {new Date(challenge.endDate).toLocaleDateString()}
          </Caption>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
            <Caption style={styles.progressText}>{progressPercentage}%</Caption>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (
    loading &&
    !refreshing &&
    friends.length === 0 &&
    challenges.length === 0
  ) {
    return <Loading fullScreen text="Loading social data..." />;
  }

  const hasFriendRequests =
    requests &&
    (requests.incoming?.length > 0 || requests.outgoing?.length > 0);
  const pendingRequestsCount =
    (requests?.incoming?.length || 0) + (requests?.outgoing?.length || 0);

  return (
    <Container>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Friend Requests Card */}
        {hasFriendRequests && (
          <Card style={styles.friendRequestsCard}>
            <View style={styles.sectionHeader}>
              <Subheading>Friend Requests</Subheading>
              <Caption>{pendingRequestsCount} pending</Caption>
            </View>

            {requests.incoming && requests.incoming.length > 0 && (
              <View style={styles.requestsContainer}>
                <Caption style={styles.requestsSubheader}>
                  Incoming Requests
                </Caption>

                {requests.incoming.map((request) => (
                  <View key={request.id} style={styles.requestItem}>
                    <View style={styles.requestProfile}>
                      {request.sender.photoURL ? (
                        <Image
                          source={{ uri: request.sender.photoURL }}
                          style={styles.requestImage}
                        />
                      ) : (
                        <View style={styles.requestPlaceholder}>
                          <Ionicons
                            name="person"
                            size={16}
                            color={theme.colors.primary}
                          />
                        </View>
                      )}
                      <Body style={styles.requestName}>
                        {request.sender.displayName}
                      </Body>
                    </View>

                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.requestButton, styles.acceptButton]}
                        onPress={() => {
                          // Accept friend request
                          dispatch(
                            respondToFriendRequest({
                              requestId: request.id,
                              accept: true,
                            })
                          );
                        }}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={theme.colors.success}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.requestButton, styles.rejectButton]}
                        onPress={() => {
                          // Reject friend request
                          dispatch(
                            respondToFriendRequest({
                              requestId: request.id,
                              accept: false,
                            })
                          );
                        }}
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {requests.outgoing && requests.outgoing.length > 0 && (
              <View style={styles.requestsContainer}>
                <Caption style={styles.requestsSubheader}>
                  Sent Requests
                </Caption>

                {requests.outgoing.map((request) => (
                  <View key={request.id} style={styles.requestItem}>
                    <View style={styles.requestProfile}>
                      {request.receiver.photoURL ? (
                        <Image
                          source={{ uri: request.receiver.photoURL }}
                          style={styles.requestImage}
                        />
                      ) : (
                        <View style={styles.requestPlaceholder}>
                          <Ionicons
                            name="person"
                            size={16}
                            color={theme.colors.primary}
                          />
                        </View>
                      )}
                      <Body style={styles.requestName}>
                        {request.receiver.displayName}
                      </Body>
                    </View>

                    <Caption style={styles.pendingText}>Pending</Caption>
                  </View>
                ))}
              </View>
            )}

            <Button
              title="View All Requests"
              onPress={goToFriendsList}
              type="outline"
              size="small"
              style={styles.viewAllButton}
            />
          </Card>
        )}

        {/* Friends List Card */}
        <Card style={styles.friendsCard}>
          <View style={styles.sectionHeader}>
            <Subheading>Friends</Subheading>

            <TouchableOpacity onPress={goToAddFriend}>
              <Ionicons
                name="person-add"
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={40} color={theme.colors.gray} />
              <Body style={styles.emptyStateText}>
                Add friends to share your progress and motivate each other
              </Body>
              <Button
                title="Add Friends"
                onPress={goToAddFriend}
                type="outline"
                size="small"
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            <>
              <View style={styles.friendsList}>
                {friends.slice(0, 5).map(renderFriendItem)}

                {friends.length > 5 && (
                  <TouchableOpacity
                    style={styles.friendItem}
                    onPress={goToFriendsList}
                  >
                    <View
                      style={[
                        styles.friendPlaceholder,
                        styles.viewMorePlaceholder,
                      ]}
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Caption style={styles.friendName}>View All</Caption>
                  </TouchableOpacity>
                )}
              </View>

              <Button
                title="View All Friends"
                onPress={goToFriendsList}
                type="outline"
                size="small"
                style={styles.viewAllButton}
              />
            </>
          )}
        </Card>

        {/* Active Challenges Card */}
        <Card style={styles.challengesCard}>
          <View style={styles.sectionHeader}>
            <Subheading>Active Challenges</Subheading>

            <TouchableOpacity onPress={goToCreateChallenge}>
              <Ionicons
                name="add-circle"
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {challenges.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy" size={40} color={theme.colors.gray} />
              <Body style={styles.emptyStateText}>
                Start a challenge with friends to boost your motivation
              </Body>
              <Button
                title="Create Challenge"
                onPress={goToCreateChallenge}
                type="outline"
                size="small"
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            <>
              <View style={styles.challengesList}>
                {challenges.slice(0, 3).map(renderChallengeItem)}
              </View>

              {challenges.length > 3 && (
                <Button
                  title="View All Challenges"
                  onPress={goToChallenges}
                  type="outline"
                  size="small"
                  style={styles.viewAllButton}
                />
              )}
            </>
          )}
        </Card>

        {/* Leaderboard Card - Premium Feature */}
        {subscription.isSubscribed ? (
          <Card style={styles.leaderboardCard}>
            <Subheading style={styles.leaderboardTitle}>
              Weekly Leaderboard
            </Subheading>

            <View style={styles.leaderboardList}>
              {/* First Place */}
              <View style={styles.leaderboardItem}>
                <View style={styles.rankContainer}>
                  <View style={[styles.rankBadge, styles.firstPlace]}>
                    <Ionicons
                      name="trophy"
                      size={16}
                      color={theme.colors.white}
                    />
                  </View>
                </View>

                <View style={styles.leaderProfile}>
                  <Image
                    source={{
                      uri:
                        friends[0]?.photoURL ||
                        "https://via.placeholder.com/50",
                    }}
                    style={styles.leaderImage}
                  />
                  <Body style={styles.leaderName}>
                    {friends[0]?.displayName || "Sarah J."}
                  </Body>
                </View>

                <View style={styles.scoreContainer}>
                  <Body style={styles.scoreText}>98%</Body>
                  <Caption>Completion</Caption>
                </View>
              </View>

              {/* Second Place */}
              <View style={styles.leaderboardItem}>
                <View style={styles.rankContainer}>
                  <View style={[styles.rankBadge, styles.secondPlace]}>
                    <Body style={styles.rankText}>2</Body>
                  </View>
                </View>

                <View style={styles.leaderProfile}>
                  <Image
                    source={{
                      uri:
                        friends[1]?.photoURL ||
                        "https://via.placeholder.com/50",
                    }}
                    style={styles.leaderImage}
                  />
                  <Body style={styles.leaderName}>
                    {friends[1]?.displayName || "Mike R."}
                  </Body>
                </View>

                <View style={styles.scoreContainer}>
                  <Body style={styles.scoreText}>92%</Body>
                  <Caption>Completion</Caption>
                </View>
              </View>

              {/* Third Place */}
              <View style={styles.leaderboardItem}>
                <View style={styles.rankContainer}>
                  <View style={[styles.rankBadge, styles.thirdPlace]}>
                    <Body style={styles.rankText}>3</Body>
                  </View>
                </View>

                <View style={styles.leaderProfile}>
                  <Image
                    source={{
                      uri:
                        friends[2]?.photoURL ||
                        "https://via.placeholder.com/50",
                    }}
                    style={styles.leaderImage}
                  />
                  <Body style={styles.leaderName}>
                    {friends[2]?.displayName || "James T."}
                  </Body>
                </View>

                <View style={styles.scoreContainer}>
                  <Body style={styles.scoreText}>85%</Body>
                  <Caption>Completion</Caption>
                </View>
              </View>

              {/* Your Rank */}
              <View style={[styles.leaderboardItem, styles.yourRank]}>
                <View style={styles.rankContainer}>
                  <View style={[styles.rankBadge, styles.yourRankBadge]}>
                    <Body style={styles.yourRankText}>4</Body>
                  </View>
                </View>

                <View style={styles.leaderProfile}>
                  <Image
                    source={{
                      uri: user?.photoURL || "https://via.placeholder.com/50",
                    }}
                    style={styles.leaderImage}
                  />
                  <Body style={styles.leaderName}>You</Body>
                </View>

                <View style={styles.scoreContainer}>
                  <Body style={styles.scoreText}>82%</Body>
                  <Caption>Completion</Caption>
                </View>
              </View>
            </View>

            <Button
              title="View Full Leaderboard"
              onPress={goToChallenges}
              type="outline"
              size="small"
              style={styles.viewAllButton}
            />
          </Card>
        ) : (
          <Card style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="trophy"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>
                  Unlock Social Leaderboards
                </Body>
                <Caption>
                  Compete with friends and see who's most consistent!
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  friendRequestsCard: {
    marginBottom: theme.spacing.medium,
  },
  requestsContainer: {
    marginBottom: theme.spacing.medium,
  },
  requestsSubheader: {
    marginBottom: theme.spacing.small,
    color: theme.colors.darkGray,
  },
  requestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  requestProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: theme.spacing.small,
  },
  requestPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.small,
  },
  requestName: {
    fontFamily: theme.fonts.medium,
  },
  requestActions: {
    flexDirection: "row",
  },
  requestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: theme.spacing.small,
  },
  acceptButton: {
    backgroundColor: `${theme.colors.success}20`,
  },
  rejectButton: {
    backgroundColor: `${theme.colors.error}20`,
  },
  pendingText: {
    color: theme.colors.warning,
  },
  friendsCard: {
    marginBottom: theme.spacing.medium,
  },
  friendsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.spacing.medium,
  },
  friendItem: {
    alignItems: "center",
    marginRight: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    width: 60,
  },
  friendAvatar: {
    marginBottom: theme.spacing.xs,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  viewMorePlaceholder: {
    backgroundColor: theme.colors.lightGray,
  },
  friendName: {
    textAlign: "center",
    width: 60,
  },
  emptyState: {
    alignItems: "center",
    padding: theme.spacing.large,
  },
  emptyStateText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginVertical: theme.spacing.medium,
  },
  emptyStateButton: {
    minWidth: 120,
  },
  viewAllButton: {
    alignSelf: "center",
  },
  challengesCard: {
    marginBottom: theme.spacing.medium,
  },
  challengesList: {
    marginBottom: theme.spacing.medium,
  },
  challengeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  challengeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontFamily: theme.fonts.semiBold,
    marginBottom: 2,
  },
  challengeInfo: {
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    width: 36,
    textAlign: "right",
  },
  leaderboardCard: {
    marginBottom: theme.spacing.medium,
  },
  leaderboardTitle: {
    marginBottom: theme.spacing.medium,
  },
  leaderboardList: {
    marginBottom: theme.spacing.medium,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  firstPlace: {
    backgroundColor: theme.colors.warning,
  },
  secondPlace: {
    backgroundColor: theme.colors.gray,
  },
  thirdPlace: {
    backgroundColor: theme.colors.tertiary,
  },
  yourRankBadge: {
    backgroundColor: theme.colors.primary,
  },
  rankText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
  },
  yourRankText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
  },
  leaderProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  leaderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.small,
  },
  leaderName: {
    fontFamily: theme.fonts.medium,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreText: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },
  yourRank: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.small,
    borderBottomWidth: 0,
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

export default SocialDashboardScreen;

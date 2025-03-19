import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { firestore } from "../../services/api/firebase";
import { fetchChallenges } from "../../store/slices/socialSlice";
import { updateXPPoints } from "../../store/slices/progressSlice";
import { Card, Container, Button, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { ProgressCircle } from "../../components/habits";
import { theme } from "../../theme";

const ChallengeDetailScreen = ({ navigation, route }) => {
  const { challenge: initialChallenge } = route.params;

  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(initialChallenge);
  const [participants, setParticipants] = useState([]);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { subscription } = useSelector((state) => state.premium);
  const { items: habits } = useSelector((state) => state.habits);

  useEffect(() => {
    loadChallenge();

    // Set navigation options
    navigation.setOptions({
      title: initialChallenge?.title || "Challenge",
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
  }, [initialChallenge?.id]);

  const loadChallenge = async () => {
    setLoading(true);

    try {
      // Get latest challenge data
      const challengeDoc = await getDoc(
        doc(firestore, "challenges", initialChallenge.id)
      );
      if (challengeDoc.exists()) {
        const challengeData = {
          id: challengeDoc.id,
          ...challengeDoc.data(),
          startDate:
            challengeDoc.data().startDate?.toDate?.() ||
            challengeDoc.data().startDate,
          endDate:
            challengeDoc.data().endDate?.toDate?.() ||
            challengeDoc.data().endDate,
        };

        setChallenge(challengeData);

        // Load participant details
        const participantDetails = [];
        for (const participant of challengeData.participants) {
          if (participant.userId) {
            // Skip detailed loading for the current user
            if (participant.userId === user.uid) {
              participantDetails.push({
                ...participant,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isCurrentUser: true,
              });
              continue;
            }

            // Load participant details
            try {
              const userDoc = await getDoc(
                doc(firestore, "users", participant.userId)
              );
              if (userDoc.exists()) {
                participantDetails.push({
                  ...participant,
                  displayName: userDoc.data().displayName,
                  photoURL: userDoc.data().photoURL,
                  isCurrentUser: false,
                });
              } else {
                participantDetails.push({
                  ...participant,
                  displayName: "Unknown User",
                  isCurrentUser: false,
                });
              }
            } catch (error) {
              console.error("Error loading participant:", error);
              participantDetails.push({
                ...participant,
                displayName: "Unknown User",
                isCurrentUser: false,
              });
            }
          }
        }

        // Sort participants by progress (descending)
        participantDetails.sort((a, b) => b.progress - a.progress);
        setParticipants(participantDetails);
      }
    } catch (error) {
      console.error("Error loading challenge:", error);
      Alert.alert(
        "Error",
        "Failed to load challenge details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Show options menu
  const showOptions = () => {
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    const isActive = endDate >= now;

    const options = [
      {
        text: "Cancel",
        style: "cancel",
      },
    ];

    // Add leave option if challenge is active
    if (isActive) {
      options.push({
        text: "Leave Challenge",
        style: "destructive",
        onPress: confirmLeaveChallenge,
      });
    }

    // Add share option
    options.push({
      text: "Share Challenge",
      onPress: shareChallenge,
    });

    Alert.alert("Challenge Options", "What would you like to do?", options);
  };

  // Confirm leave challenge
  const confirmLeaveChallenge = () => {
    Alert.alert(
      "Leave Challenge",
      "Are you sure you want to leave this challenge? Your progress will be lost.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: handleLeaveChallenge,
        },
      ]
    );
  };

  // Handle leave challenge
  const handleLeaveChallenge = async () => {
    setLoading(true);

    try {
      // Update challenge to remove user
      const challengeRef = doc(firestore, "challenges", challenge.id);
      await updateDoc(challengeRef, {
        participants: challenge.participants.filter(
          (p) => p.userId !== user.uid
        ),
      });

      // Refresh challenges
      dispatch(fetchChallenges());

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error("Error leaving challenge:", error);
      Alert.alert("Error", "Failed to leave challenge. Please try again.");
      setLoading(false);
    }
  };

  // Share challenge
  const shareChallenge = async () => {
    try {
      await Share.share({
        message: `Join me in the "${
          challenge.title
        }" challenge on Daily Habits Tracker! Let's build better habits together. Download the app and use challenge code: ${challenge.id.slice(
          0,
          8
        )}`,
        title: `Join my "${challenge.title}" challenge!`,
      });
    } catch (error) {
      console.error("Error sharing challenge:", error);
      Alert.alert("Error", "Failed to share challenge. Please try again.");
    }
  };

  // Update progress manually
  const updateProgress = async (newProgress) => {
    if (newProgress < 0 || newProgress > 100) return;

    setLoading(true);

    try {
      // Find current user in participants
      const userIndex = challenge.participants.findIndex(
        (p) => p.userId === user.uid
      );
      if (userIndex === -1) {
        setLoading(false);
        return;
      }

      // Check if this would complete the challenge
      const wasCompleted = challenge.participants[userIndex].completed;
      const willComplete = newProgress === 100;

      // Create updated participants array
      const updatedParticipants = [...challenge.participants];
      updatedParticipants[userIndex] = {
        ...updatedParticipants[userIndex],
        progress: newProgress,
        completed: willComplete,
        completedAt:
          willComplete && !wasCompleted
            ? new Date().toISOString()
            : updatedParticipants[userIndex].completedAt,
      };

      // Update challenge in Firestore
      const challengeRef = doc(firestore, "challenges", challenge.id);
      await updateDoc(challengeRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp(),
      });

      // If just completed, award rewards
      if (willComplete && !wasCompleted && challenge.rewards) {
        // Award XP
        if (challenge.rewards.xp) {
          dispatch(updateXPPoints(challenge.rewards.xp));

          // Update user's XP in Firestore
          const userRef = doc(firestore, "users", user.uid);
          await updateDoc(userRef, {
            "stats.xpPoints": increment(challenge.rewards.xp),
            updatedAt: serverTimestamp(),
          });
        }

        // Create achievement if applicable
        if (challenge.rewards.badge) {
          const achievementData = {
            userId: user.uid,
            type: "challenge",
            title: `${challenge.title} Champion`,
            description: `Completed the "${challenge.title}" challenge`,
            icon: "trophy",
            unlockedAt: new Date().toISOString(),
            xpAwarded: challenge.rewards.xp || 0,
            visible: true,
            isPublic: true,
          };

          await addDoc(collection(firestore, "achievements"), achievementData);
        }

        // Show completion alert
        Alert.alert(
          "Challenge Completed!",
          `Congratulations! You've completed the "${
            challenge.title
          }" challenge and earned ${challenge.rewards.xp || 0} XP.`,
          [{ text: "Great!" }]
        );
      }

      // Update local state
      setChallenge({
        ...challenge,
        participants: updatedParticipants,
      });

      // Update participants list
      const updatedParticipantDetails = participants.map((p) => {
        if (p.userId === user.uid) {
          return {
            ...p,
            progress: newProgress,
            completed: willComplete,
            completedAt:
              willComplete && !wasCompleted
                ? new Date().toISOString()
                : p.completedAt,
          };
        }
        return p;
      });

      // Sort updated participants by progress
      updatedParticipantDetails.sort((a, b) => b.progress - a.progress);
      setParticipants(updatedParticipantDetails);

      // Refresh challenges in the background
      dispatch(fetchChallenges());
    } catch (error) {
      console.error("Error updating progress:", error);
      Alert.alert("Error", "Failed to update progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !challenge) {
    return <Loading fullScreen text="Loading challenge..." />;
  }

  // Get current user's progress
  const userParticipant = challenge.participants.find(
    (p) => p.userId === user.uid
  );
  const userProgress = userParticipant?.progress || 0;
  const isCompleted = userParticipant?.completed || false;

  // Calculate days remaining
  const now = new Date();
  const endDate = new Date(challenge.endDate);
  const daysDiff = Math.max(
    0,
    Math.floor((endDate - now) / (1000 * 60 * 60 * 24))
  );

  // Check if challenge is active
  const startDate = new Date(challenge.startDate);
  const isActive = startDate <= now && endDate >= now && !isCompleted;

  // Check if challenge is upcoming
  const isUpcoming = startDate > now;

  // Get included habits
  const includedHabits = challenge.habits
    ? habits.filter((habit) => challenge.habits.includes(habit.id))
    : [];

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge Header */}
        <Card style={styles.headerCard}>
          <View style={styles.challengeHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={challenge.icon || "trophy"}
                size={32}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.headerInfo}>
              <Title style={styles.title}>{challenge.title}</Title>
              <Body style={styles.description}>{challenge.description}</Body>

              <View style={styles.dateContainer}>
                <Caption>
                  {new Date(challenge.startDate).toLocaleDateString()} -{" "}
                  {new Date(challenge.endDate).toLocaleDateString()}
                </Caption>

                {isActive && (
                  <View style={styles.statusBadge}>
                    <Caption style={styles.statusText}>
                      {daysDiff === 0 ? "Last day" : `${daysDiff} days left`}
                    </Caption>
                  </View>
                )}

                {isCompleted && (
                  <View style={[styles.statusBadge, styles.completedBadge]}>
                    <Caption style={[styles.statusText, styles.completedText]}>
                      Completed
                    </Caption>
                  </View>
                )}

                {isUpcoming && (
                  <View style={[styles.statusBadge, styles.upcomingBadge]}>
                    <Caption style={[styles.statusText, styles.upcomingText]}>
                      Upcoming
                    </Caption>
                  </View>
                )}

                {!isActive && !isCompleted && !isUpcoming && (
                  <View style={[styles.statusBadge, styles.expiredBadge]}>
                    <Caption style={[styles.statusText, styles.expiredText]}>
                      Expired
                    </Caption>
                  </View>
                )}
              </View>
            </View>
          </View>

          {isActive && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Subheading>Your Progress</Subheading>
                <ProgressCircle
                  size={50}
                  strokeWidth={5}
                  progress={userProgress / 100}
                  color={theme.colors.primary}
                >
                  <Body style={styles.progressText}>{userProgress}%</Body>
                </ProgressCircle>
              </View>

              <View style={styles.progressControls}>
                <TouchableOpacity
                  style={styles.progressButton}
                  onPress={() => updateProgress(Math.max(0, userProgress - 10))}
                  disabled={userProgress <= 0}
                >
                  <Ionicons
                    name="remove"
                    size={24}
                    color={
                      userProgress <= 0
                        ? theme.colors.gray
                        : theme.colors.primary
                    }
                  />
                </TouchableOpacity>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${userProgress}%` },
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.progressButton}
                  onPress={() =>
                    updateProgress(Math.min(100, userProgress + 10))
                  }
                  disabled={userProgress >= 100}
                >
                  <Ionicons
                    name="add"
                    size={24}
                    color={
                      userProgress >= 100
                        ? theme.colors.gray
                        : theme.colors.primary
                    }
                  />
                </TouchableOpacity>
              </View>

              <Button
                title={userProgress < 100 ? "Mark as Complete" : "Completed!"}
                onPress={() => updateProgress(100)}
                disabled={userProgress >= 100}
                style={styles.completeButton}
                type={userProgress >= 100 ? "secondary" : "primary"}
                fullWidth
              />
            </View>
          )}

          {isUpcoming && (
            <View style={styles.upcomingSection}>
              <Body style={styles.upcomingText}>
                This challenge will start on{" "}
                {new Date(challenge.startDate).toLocaleDateString()}
              </Body>
              <Button
                title="Invite Friends"
                onPress={shareChallenge}
                style={styles.inviteButton}
                icon={
                  <Ionicons
                    name="share-social"
                    size={20}
                    color={theme.colors.white}
                  />
                }
                iconPosition="left"
                fullWidth
              />
            </View>
          )}
        </Card>

        {/* Participants Card */}
        <Card style={styles.participantsCard}>
          <Subheading style={styles.sectionTitle}>Participants</Subheading>

          <View style={styles.participantsList}>
            {participants.map((participant, index) => (
              <View key={participant.userId} style={styles.participantItem}>
                <View style={styles.rankContainer}>
                  <View
                    style={[
                      styles.rankBadge,
                      index === 0
                        ? styles.firstPlace
                        : index === 1
                        ? styles.secondPlace
                        : index === 2
                        ? styles.thirdPlace
                        : null,
                    ]}
                  >
                    <Body style={styles.rankText}>{index + 1}</Body>
                  </View>
                </View>

                <View style={styles.participantInfo}>
                  {participant.photoURL ? (
                    <Image
                      source={{ uri: participant.photoURL }}
                      style={styles.participantImage}
                    />
                  ) : (
                    <View style={styles.participantPlaceholder}>
                      <Ionicons
                        name="person"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                  )}

                  <View style={styles.participantDetails}>
                    <Body
                      style={[
                        styles.participantName,
                        participant.isCurrentUser && styles.currentUserName,
                      ]}
                    >
                      {participant.displayName}{" "}
                      {participant.isCurrentUser && "(You)"}
                    </Body>

                    {participant.completed ? (
                      <Caption style={styles.completedLabel}>
                        Completed on{" "}
                        {new Date(participant.completedAt).toLocaleDateString()}
                      </Caption>
                    ) : (
                      <View style={styles.participantProgressContainer}>
                        <View style={styles.participantProgressBar}>
                          <View
                            style={[
                              styles.participantProgressFill,
                              { width: `${participant.progress}%` },
                            ]}
                          />
                        </View>
                        <Caption style={styles.participantProgressText}>
                          {participant.progress}%
                        </Caption>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Included Habits Card */}
        {includedHabits.length > 0 && (
          <Card style={styles.habitsCard}>
            <Subheading style={styles.sectionTitle}>Included Habits</Subheading>

            <View style={styles.habitsList}>
              {includedHabits.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  style={styles.habitItem}
                  onPress={() => navigation.navigate("HabitDetail", { habit })}
                >
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
                    <Caption style={styles.habitFrequency}>
                      {habit.frequency.type === "daily"
                        ? "Daily"
                        : habit.frequency.type === "weekly"
                        ? `${habit.frequency.days.length} days per week`
                        : "Custom"}
                    </Caption>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.darkGray}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Rewards Card */}
        <Card style={styles.rewardsCard}>
          <Subheading style={styles.sectionTitle}>Rewards</Subheading>

          <View style={styles.rewardsList}>
            {challenge.rewards?.xp && (
              <View style={styles.rewardItem}>
                <View
                  style={[
                    styles.rewardIcon,
                    { backgroundColor: `${theme.colors.warning}20` },
                  ]}
                >
                  <Ionicons
                    name="star"
                    size={24}
                    color={theme.colors.warning}
                  />
                </View>

                <View style={styles.rewardInfo}>
                  <Body style={styles.rewardTitle}>
                    {challenge.rewards.xp} XP
                  </Body>
                  <Caption>Earn experience points upon completion</Caption>
                </View>
              </View>
            )}

            {challenge.rewards?.streak && (
              <View style={styles.rewardItem}>
                <View
                  style={[
                    styles.rewardIcon,
                    { backgroundColor: `${theme.colors.error}20` },
                  ]}
                >
                  <Ionicons name="flame" size={24} color={theme.colors.error} />
                </View>

                <View style={styles.rewardInfo}>
                  <Body style={styles.rewardTitle}>
                    {challenge.rewards.streak} Streak Saver
                  </Body>
                  <Caption>Get streak protection for missing a day</Caption>
                </View>
              </View>
            )}

            {challenge.rewards?.badge && (
              <View style={styles.rewardItem}>
                <View
                  style={[
                    styles.rewardIcon,
                    { backgroundColor: `${theme.colors.tertiary}20` },
                  ]}
                >
                  <Ionicons
                    name="ribbon"
                    size={24}
                    color={theme.colors.tertiary}
                  />
                </View>

                <View style={styles.rewardInfo}>
                  <Body style={styles.rewardTitle}>Special Badge</Body>
                  <Caption>Exclusive achievement for your profile</Caption>
                </View>
              </View>
            )}

            {(!challenge.rewards ||
              (!challenge.rewards.xp &&
                !challenge.rewards.streak &&
                !challenge.rewards.badge)) && (
              <Body style={styles.noRewardsText}>
                No specific rewards for this challenge
              </Body>
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Share Challenge"
            onPress={shareChallenge}
            type="outline"
            icon={
              <Ionicons
                name="share-social"
                size={20}
                color={theme.colors.primary}
              />
            }
            iconPosition="left"
            style={styles.shareButton}
          />

          {isActive && (
            <Button
              title="Leave Challenge"
              onPress={confirmLeaveChallenge}
              type="secondary"
              icon={
                <Ionicons name="exit" size={20} color={theme.colors.white} />
              }
              iconPosition="left"
              style={styles.leaveButton}
            />
          )}
        </View>

        {/* Stats Comparison - Premium Feature */}
        {subscription.isSubscribed && participants.length > 1 ? (
          <Card style={styles.statsCard}>
            <Subheading style={styles.sectionTitle}>
              Detailed Statistics
            </Subheading>

            <View style={styles.statsChartContainer}>
              {/* We'd implement a more sophisticated chart here in a real app */}
              <View style={styles.barChartContainer}>
                <Caption style={styles.chartLabel}>
                  Completion Rate by Day
                </Caption>

                <View style={styles.barChart}>
                  <View style={styles.barGroup}>
                    <Caption style={styles.barLabel}>Mon</Caption>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: "70%" }]} />
                    </View>
                  </View>

                  <View style={styles.barGroup}>
                    <Caption style={styles.barLabel}>Tue</Caption>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: "85%" }]} />
                    </View>
                  </View>

                  <View style={styles.barGroup}>
                    <Caption style={styles.barLabel}>Wed</Caption>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: "65%" }]} />
                    </View>
                  </View>

                  <View style={styles.barGroup}>
                    <Caption style={styles.barLabel}>Thu</Caption>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: "90%" }]} />
                    </View>
                  </View>

                  <View style={styles.barGroup}>
                    <Caption style={styles.barLabel}>Fri</Caption>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: "60%" }]} />
                    </View>
                  </View>

                  <View style={styles.barGroup}>
                    <Caption style={styles.barLabel}>Sat</Caption>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: "40%" }]} />
                    </View>
                  </View>

                  <View style={styles.barGroup}>
                    <Caption style={styles.barLabel}>Sun</Caption>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: "50%" }]} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        ) : (
          !subscription.isSubscribed &&
          participants.length > 1 && (
            <Card style={styles.premiumCard}>
              <View style={styles.premiumContent}>
                <Ionicons
                  name="analytics"
                  size={24}
                  color={theme.colors.secondary}
                />
                <View style={styles.premiumTextContainer}>
                  <Body style={styles.premiumTitle}>
                    Unlock Detailed Statistics
                  </Body>
                  <Caption>
                    See when you're most likely to complete challenge tasks
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
          )
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
  headerCard: {
    marginBottom: theme.spacing.medium,
  },
  challengeHeader: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    marginVertical: 0,
    marginBottom: 4,
  },
  description: {
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.small,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusBadge: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.small,
  },
  completedBadge: {
    backgroundColor: `${theme.colors.success}20`,
  },
  upcomingBadge: {
    backgroundColor: `${theme.colors.info}20`,
  },
  expiredBadge: {
    backgroundColor: `${theme.colors.error}20`,
  },
  statusText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.medium,
  },
  completedText: {
    color: theme.colors.success,
  },
  upcomingText: {
    color: theme.colors.info,
  },
  expiredText: {
    color: theme.colors.error,
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: theme.spacing.medium,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  progressText: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fonts.bold,
  },
  progressControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  progressButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.medium,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  completeButton: {
    marginTop: theme.spacing.small,
  },
  upcomingSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: theme.spacing.medium,
  },
  upcomingText: {
    color: theme.colors.darkGray,
    textAlign: "center",
    marginBottom: theme.spacing.medium,
  },
  inviteButton: {
    backgroundColor: theme.colors.info,
  },
  sectionTitle: {
    marginBottom: theme.spacing.medium,
  },
  participantsCard: {
    marginBottom: theme.spacing.medium,
  },
  participantsList: {},
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  firstPlace: {
    backgroundColor: theme.colors.warning,
  },
  secondPlace: {
    backgroundColor: theme.colors.secondary,
  },
  thirdPlace: {
    backgroundColor: theme.colors.tertiary,
  },
  rankText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.small,
  },
  participantInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  participantImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.small,
  },
  participantPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.small,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    marginBottom: 4,
  },
  currentUserName: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },
  completedLabel: {
    color: theme.colors.success,
  },
  participantProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 3,
    marginRight: theme.spacing.small,
    overflow: "hidden",
  },
  participantProgressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  participantProgressText: {
    width: 35,
  },
  habitsCard: {
    marginBottom: theme.spacing.medium,
  },
  habitsList: {},
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.small,
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
    marginBottom: 2,
  },
  habitFrequency: {
    color: theme.colors.darkGray,
  },
  rewardsCard: {
    marginBottom: theme.spacing.medium,
  },
  rewardsList: {},
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontFamily: theme.fonts.semiBold,
    marginBottom: 2,
  },
  noRewardsText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    padding: theme.spacing.medium,
  },
  actionButtons: {
    flexDirection: "row",
    marginBottom: theme.spacing.large,
  },
  shareButton: {
    flex: 1,
    marginRight: theme.spacing.small,
  },
  leaveButton: {
    flex: 1,
    marginLeft: theme.spacing.small,
    backgroundColor: theme.colors.error,
  },
  statsCard: {
    marginBottom: theme.spacing.large,
  },
  statsChartContainer: {
    alignItems: "center",
  },
  barChartContainer: {
    width: "100%",
    paddingVertical: theme.spacing.medium,
  },
  chartLabel: {
    textAlign: "center",
    marginBottom: theme.spacing.medium,
  },
  barChart: {
    flexDirection: "row",
    height: 150,
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.small,
  },
  barGroup: {
    alignItems: "center",
  },
  barLabel: {
    marginTop: theme.spacing.small,
  },
  barContainer: {
    width: 20,
    height: 120,
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.small,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
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

export default ChallengeDetailScreen;

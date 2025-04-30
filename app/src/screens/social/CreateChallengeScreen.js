import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/api/firebase";
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

const CreateChallengeScreen = ({ navigation, route }) => {
  // Get friend ID if provided from route params
  const friendId = route.params?.friendId;

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("trophy");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ); // Default to 7 days
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState(
    friendId ? [friendId] : []
  );
  const [isPublic, setIsPublic] = useState(false);
  const [rewards, setRewards] = useState({
    xp: 50,
    streak: 0,
    badge: true,
  });

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { friends } = useSelector((state) => state.social);
  const { items: habits } = useSelector((state) => state.habits);
  const { subscription } = useSelector((state) => state.premium);

  // Common icons for challenges
  const CHALLENGE_ICONS = [
    "trophy",
    "ribbon",
    "flame",
    "star",
    "medal",
    "fitness",
    "barbell",
    "body",
    "bicycle",
    "walk",
    "book",
    "school",
    "library",
    "bulb",
    "brain",
    "heart",
    "medical",
    "pulse",
    "nutrition",
    "restaurant",
    "people",
    "person-add",
    "happy",
    "analytics",
    "trending-up",
  ];

  // Handle start date change
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDate(selectedDate);

      // If end date is before new start date, adjust it
      if (endDate < selectedDate) {
        // Set end date to start date + 7 days
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(selectedDate.getDate() + 7);
        setEndDate(newEndDate);
      }
    }
  };

  // Handle end date change
  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      // Ensure end date is not before start date
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        Alert.alert("Invalid Date", "End date cannot be before start date.");
      }
    }
  };

  // Toggle habit selection
  const toggleHabitSelection = (habitId) => {
    setSelectedHabits((prev) => {
      if (prev.includes(habitId)) {
        return prev.filter((id) => id !== habitId);
      } else {
        return [...prev, habitId];
      }
    });
  };

  // Toggle friend selection
  const toggleFriendSelection = (friendId) => {
    setSelectedFriends((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  // Create challenge
  const handleCreateChallenge = async () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for your challenge.");
      return;
    }

    if (selectedFriends.length === 0 && isPublic === false) {
      Alert.alert(
        "No Participants",
        "Please invite friends or make the challenge public."
      );
      return;
    }

    setLoading(true);

    try {
      // Create participants array
      const participants = [
        {
          userId: user.uid,
          progress: 0,
          completed: false,
        },
      ];

      // Add selected friends
      selectedFriends.forEach((friendId) => {
        participants.push({
          userId: friendId,
          progress: 0,
          completed: false,
        });
      });

      // Challenge data
      const challengeData = {
        title: title.trim(),
        description: description.trim(),
        icon: selectedIcon,
        type: isPublic
          ? "public"
          : selectedFriends.length > 0
          ? "friend"
          : "personal",
        startDate,
        endDate,
        habits: selectedHabits,
        participants,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic,
        rewards: {
          xp: parseInt(rewards.xp) || 0,
          streak: parseInt(rewards.streak) || 0,
          badge: rewards.badge,
        },
        isPremium: subscription.isSubscribed,
      };

      // Add challenge to Firestore
      await addDoc(collection(db, "challenges"), challengeData);

      // Refresh challenges
      dispatch(fetchChallenges());

      // Show success message
      Alert.alert(
        "Challenge Created",
        "Your challenge has been created successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error creating challenge:", error);
      Alert.alert("Error", "Failed to create challenge. Please try again.");
      setLoading(false);
    }
  };

  // Render habit item
  const renderHabitItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.habitItem,
        selectedHabits.includes(item.id) && styles.selectedHabitItem,
      ]}
      onPress={() => toggleHabitSelection(item.id)}
    >
      <View
        style={[
          styles.habitIcon,
          { backgroundColor: `${item.color || theme.colors.primary}20` },
        ]}
      >
        <Ionicons
          name={item.icon || "checkmark-circle"}
          size={24}
          color={item.color || theme.colors.primary}
        />
      </View>

      <View style={styles.habitInfo}>
        <Body style={styles.habitTitle}>{item.title}</Body>
        <Caption>
          {item.frequency.type === "daily" ? "Daily" : "Weekly"}
        </Caption>
      </View>

      <View
        style={[
          styles.checkCircle,
          selectedHabits.includes(item.id) && styles.checkedCircle,
        ]}
      >
        {selectedHabits.includes(item.id) && (
          <Ionicons name="checkmark" size={16} color={theme.colors.white} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Render friend item
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        selectedFriends.includes(item.id) && styles.selectedFriendItem,
      ]}
      onPress={() => toggleFriendSelection(item.id)}
    >
      <View style={styles.friendAvatar}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.friendImage} />
        ) : (
          <View style={styles.friendPlaceholder}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
          </View>
        )}
      </View>

      <Body style={styles.friendName}>{item.displayName}</Body>

      <View
        style={[
          styles.checkCircle,
          selectedFriends.includes(item.id) && styles.checkedCircle,
        ]}
      >
        {selectedFriends.includes(item.id) && (
          <Ionicons name="checkmark" size={16} color={theme.colors.white} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          {/* Title and Description */}
          <View style={styles.formSection}>
            <Subheading style={styles.sectionTitle}>Challenge Info</Subheading>

            <View style={styles.inputContainer}>
              <Caption style={styles.inputLabel}>Title</Caption>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter challenge title"
                placeholderTextColor={theme.colors.gray}
              />
            </View>

            <View style={styles.inputContainer}>
              <Caption style={styles.inputLabel}>
                Description (optional)
              </Caption>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your challenge"
                placeholderTextColor={theme.colors.gray}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.iconSelector}>
              <Caption style={styles.inputLabel}>Icon</Caption>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconList}
              >
                {CHALLENGE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconItem,
                      selectedIcon === icon && styles.selectedIconItem,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons
                      name={icon}
                      size={24}
                      color={
                        selectedIcon === icon
                          ? theme.colors.white
                          : theme.colors.primary
                      }
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.formSection}>
            <Subheading style={styles.sectionTitle}>
              Challenge Duration
            </Subheading>

            <View style={styles.dateContainer}>
              <View style={styles.dateItem}>
                <Caption style={styles.inputLabel}>Start Date</Caption>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Body style={styles.dateText}>{formatDate(startDate)}</Body>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.dateItem}>
                <Caption style={styles.inputLabel}>End Date</Caption>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Body style={styles.dateText}>{formatDate(endDate)}</Body>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}

            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
                minimumDate={startDate}
              />
            )}
          </View>

          {/* Habits Selection */}
          <View style={styles.formSection}>
            <Subheading style={styles.sectionTitle}>
              Include Habits (Optional)
            </Subheading>
            <Caption style={styles.sectionDescription}>
              Select habits to include in this challenge
            </Caption>

            {habits.length === 0 ? (
              <Body style={styles.noItemsText}>
                You don't have any habits yet. Create habits first to include
                them in challenges.
              </Body>
            ) : (
              <View style={styles.habitsList}>
                {habits.slice(0, 4).map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      styles.habitItem,
                      selectedHabits.includes(habit.id) &&
                        styles.selectedHabitItem,
                    ]}
                    onPress={() => toggleHabitSelection(habit.id)}
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
                      <Caption>
                        {habit.frequency.type === "daily" ? "Daily" : "Weekly"}
                      </Caption>
                    </View>

                    <View
                      style={[
                        styles.checkCircle,
                        selectedHabits.includes(habit.id) &&
                          styles.checkedCircle,
                      ]}
                    >
                      {selectedHabits.includes(habit.id) && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={theme.colors.white}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {habits.length > 4 && (
                  <Button
                    title={`View ${habits.length - 4} More Habits`}
                    type="outline"
                    size="small"
                    onPress={() => {
                      // In a full app, this would open a modal with all habits
                      Alert.alert(
                        "All Habits",
                        "This would show all your habits in a full implementation."
                      );
                    }}
                    style={styles.viewMoreButton}
                  />
                )}
              </View>
            )}
          </View>

          {/* Friends Selection */}
          <View style={styles.formSection}>
            <Subheading style={styles.sectionTitle}>Invite Friends</Subheading>
            <Caption style={styles.sectionDescription}>
              Select friends to join your challenge
            </Caption>

            {friends.length === 0 ? (
              <Body style={styles.noItemsText}>
                You don't have any friends yet. Add friends first to invite them
                to challenges.
              </Body>
            ) : (
              <View style={styles.friendsList}>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendItem,
                      selectedFriends.includes(friend.id) &&
                        styles.selectedFriendItem,
                    ]}
                    onPress={() => toggleFriendSelection(friend.id)}
                  >
                    <View style={styles.friendAvatar}>
                      {friend.photoURL ? (
                        <Image
                          source={{ uri: friend.photoURL }}
                          style={styles.friendImage}
                        />
                      ) : (
                        <View style={styles.friendPlaceholder}>
                          <Ionicons
                            name="person"
                            size={20}
                            color={theme.colors.primary}
                          />
                        </View>
                      )}
                    </View>

                    <Body style={styles.friendName}>{friend.displayName}</Body>

                    <View
                      style={[
                        styles.checkCircle,
                        selectedFriends.includes(friend.id) &&
                          styles.checkedCircle,
                      ]}
                    >
                      {selectedFriends.includes(friend.id) && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={theme.colors.white}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.publicToggle}>
              <Body>Make Challenge Public</Body>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: theme.colors.lightGray,
                  true: `${theme.colors.primary}80`,
                }}
                thumbColor={isPublic ? theme.colors.primary : theme.colors.gray}
              />
            </View>

            {isPublic && !subscription.isSubscribed && (
              <View style={styles.premiumNote}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={theme.colors.warning}
                />
                <Caption style={styles.premiumNoteText}>
                  Public challenges are limited to 5 participants for free
                  users. Upgrade to premium for unlimited participants.
                </Caption>
              </View>
            )}
          </View>

          {/* Rewards */}
          <View style={styles.formSection}>
            <Subheading style={styles.sectionTitle}>
              Challenge Rewards
            </Subheading>

            <View style={styles.rewardItem}>
              <View style={styles.rewardLabel}>
                <Ionicons name="star" size={20} color={theme.colors.warning} />
                <Body style={styles.rewardText}>XP Points</Body>
              </View>

              <TextInput
                style={styles.rewardInput}
                value={rewards.xp.toString()}
                onChangeText={(text) => setRewards({ ...rewards, xp: text })}
                keyboardType="number-pad"
                placeholder="50"
                placeholderTextColor={theme.colors.gray}
              />
            </View>

            <View style={styles.rewardItem}>
              <View style={styles.rewardLabel}>
                <Ionicons name="flame" size={20} color={theme.colors.error} />
                <Body style={styles.rewardText}>Streak Savers</Body>
              </View>

              <TextInput
                style={styles.rewardInput}
                value={rewards.streak.toString()}
                onChangeText={(text) =>
                  setRewards({ ...rewards, streak: text })
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.gray}
              />
            </View>

            <View style={styles.rewardItem}>
              <View style={styles.rewardLabel}>
                <Ionicons
                  name="ribbon"
                  size={20}
                  color={theme.colors.tertiary}
                />
                <Body style={styles.rewardText}>Special Badge</Body>
              </View>

              <Switch
                value={rewards.badge}
                onValueChange={(value) =>
                  setRewards({ ...rewards, badge: value })
                }
                trackColor={{
                  false: theme.colors.lightGray,
                  true: `${theme.colors.tertiary}80`,
                }}
                thumbColor={
                  rewards.badge ? theme.colors.tertiary : theme.colors.gray
                }
              />
            </View>

            {!subscription.isSubscribed && (
              <View style={styles.premiumNote}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={theme.colors.warning}
                />
                <Caption style={styles.premiumNoteText}>
                  Premium users can create challenges with custom badges and
                  higher XP rewards.
                </Caption>
              </View>
            )}
          </View>
        </Card>

        {/* Create Button */}
        <Button
          title="Create Challenge"
          onPress={handleCreateChallenge}
          loading={loading}
          style={styles.createButton}
          fullWidth
        />
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
  formCard: {
    marginBottom: theme.spacing.medium,
  },
  formSection: {
    marginBottom: theme.spacing.large,
    paddingBottom: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  formSection: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    marginBottom: theme.spacing.small,
  },
  sectionDescription: {
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.medium,
  },
  inputContainer: {
    marginBottom: theme.spacing.medium,
  },
  inputLabel: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.black,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  iconSelector: {
    marginBottom: theme.spacing.medium,
  },
  iconList: {
    paddingVertical: theme.spacing.small,
  },
  iconItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.small,
  },
  selectedIconItem: {
    backgroundColor: theme.colors.primary,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
  },
  dateText: {
    fontSize: theme.fontSizes.small,
  },
  habitsList: {
    marginBottom: theme.spacing.small,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
  },
  selectedHabitItem: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
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
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedCircle: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  viewMoreButton: {
    alignSelf: "center",
    marginTop: theme.spacing.small,
  },
  noItemsText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    paddingVertical: theme.spacing.medium,
  },
  friendsList: {
    marginBottom: theme.spacing.medium,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
  },
  selectedFriendItem: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  friendAvatar: {
    marginRight: theme.spacing.medium,
  },
  friendImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  friendName: {
    flex: 1,
  },
  publicToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.medium,
  },
  premiumNote: {
    flexDirection: "row",
    backgroundColor: `${theme.colors.warning}10`,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginTop: theme.spacing.small,
    alignItems: "flex-start",
  },
  premiumNoteText: {
    flex: 1,
    marginLeft: theme.spacing.small,
    color: theme.colors.darkGray,
  },
  rewardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  rewardLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardText: {
    marginLeft: theme.spacing.small,
  },
  rewardInput: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.xs,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.black,
    width: 80,
    textAlign: "center",
  },
  createButton: {
    marginBottom: theme.spacing.xxl,
  },
});

export default CreateChallengeScreen;

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { updateUserProfile } from "../../store/slices/authSlice";
import { Container, Card, Button, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [errors, setErrors] = useState({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");

      // Set notification preferences if available
      if (user.preferences) {
        setEmailNotifications(user.preferences.emailNotifications !== false);
        setPushEnabled(user.preferences.pushEnabled !== false);
        setDailyReminder(user.preferences.dailyReminder !== false);
        setReminderTime(user.preferences.reminderTime || "20:00");
      }
    }
  }, [user]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Name is required";
    }

    // Validate reminder time format (HH:MM)
    if (
      dailyReminder &&
      !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)
    ) {
      newErrors.reminderTime =
        "Please enter a valid time in 24-hour format (HH:MM)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    // Prepare updated profile data
    const profileData = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      photoURL: user?.photoURL, // Preserve the existing photoURL
      preferences: {
        emailNotifications,
        pushEnabled,
        dailyReminder,
        reminderTime,
        shareActivity: user?.preferences?.shareActivity !== false,
        showInLeaderboards: user?.preferences?.showInLeaderboards !== false,
        publicProfile: user?.preferences?.publicProfile === true,
      },
    };

    try {
      await dispatch(updateUserProfile(profileData)).unwrap();

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  // Handle time format
  const formatTime12Hour = (time24) => {
    if (!time24 || !time24.includes(":")) return "";

    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);

    if (isNaN(hour)) return "";

    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${period}`;
  };

  // Update time in 24-hour format
  const handleTimeChange = (timeStr) => {
    // Basic input handling
    setReminderTime(timeStr);

    // Clear error if fixed
    if (
      errors.reminderTime &&
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)
    ) {
      setErrors({ ...errors, reminderTime: null });
    }
  };

  // Show time picker (would use DateTimePicker in a full implementation)
  const showTimePicker = () => {
    Alert.alert(
      "Time Picker",
      "In a complete implementation, this would open a time picker. For now, please enter the time manually.",
      [{ text: "OK" }]
    );
  };

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          <Subheading style={styles.sectionTitle}>
            Profile Information
          </Subheading>

          {/* Display Name */}
          <View style={styles.inputContainer}>
            <Caption style={styles.inputLabel}>Display Name</Caption>
            <TextInput
              style={[styles.input, errors.displayName && styles.inputError]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={theme.colors.gray}
            />
            {errors.displayName && (
              <Caption style={styles.errorText}>{errors.displayName}</Caption>
            )}
          </View>

          {/* Bio */}
          <View style={styles.inputContainer}>
            <Caption style={styles.inputLabel}>Bio (optional)</Caption>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself"
              placeholderTextColor={theme.colors.gray}
              multiline
              numberOfLines={4}
            />
          </View>
        </Card>

        <Card style={styles.notificationsCard}>
          <Subheading style={styles.sectionTitle}>
            Notification Settings
          </Subheading>

          {/* Email Notifications */}
          <View style={styles.switchItem}>
            <View style={styles.switchLabel}>
              <Body>Email Notifications</Body>
              <Caption>Receive progress summaries and tips</Caption>
            </View>

            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                emailNotifications ? theme.colors.primary : theme.colors.gray
              }
            />
          </View>

          {/* Push Notifications */}
          <View style={styles.switchItem}>
            <View style={styles.switchLabel}>
              <Body>Push Notifications</Body>
              <Caption>Get reminders and updates on your device</Caption>
            </View>

            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                pushEnabled ? theme.colors.primary : theme.colors.gray
              }
            />
          </View>

          {/* Daily Reminder */}
          <View style={styles.switchItem}>
            <View style={styles.switchLabel}>
              <Body>Daily Reminder</Body>
              <Caption>Get a daily reminder to complete your habits</Caption>
            </View>

            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                dailyReminder ? theme.colors.primary : theme.colors.gray
              }
            />
          </View>

          {/* Reminder Time */}
          {dailyReminder && (
            <View style={styles.timeContainer}>
              <Caption style={styles.inputLabel}>Reminder Time</Caption>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={[
                    styles.timeInput,
                    errors.reminderTime && styles.inputError,
                  ]}
                  value={reminderTime}
                  onChangeText={handleTimeChange}
                  placeholder="20:00"
                  placeholderTextColor={theme.colors.gray}
                  keyboardType="numbers-and-punctuation"
                />

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={showTimePicker}
                >
                  <Ionicons
                    name="time"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>

              {errors.reminderTime ? (
                <Caption style={styles.errorText}>
                  {errors.reminderTime}
                </Caption>
              ) : (
                <Caption style={styles.timeHint}>
                  Format: 24-hour (HH:MM) • Current:{" "}
                  {formatTime12Hour(reminderTime)}
                </Caption>
              )}
            </View>
          )}
        </Card>

        <Card style={styles.privacyCard}>
          <Subheading style={styles.sectionTitle}>Privacy Settings</Subheading>

          {/* Privacy Settings */}
          <View style={styles.switchItem}>
            <View style={styles.switchLabel}>
              <Body>Share Activity with Friends</Body>
              <Caption>Allow friends to see your habit progress</Caption>
            </View>

            <Switch
              value={user?.preferences?.shareActivity !== false}
              onValueChange={(value) => {
                // This would be part of the profile update
              }}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                user?.preferences?.shareActivity !== false
                  ? theme.colors.primary
                  : theme.colors.gray
              }
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchLabel}>
              <Body>Show in Leaderboards</Body>
              <Caption>Allow your progress to appear in leaderboards</Caption>
            </View>

            <Switch
              value={user?.preferences?.showInLeaderboards !== false}
              onValueChange={(value) => {
                // This would be part of the profile update
              }}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                user?.preferences?.showInLeaderboards !== false
                  ? theme.colors.primary
                  : theme.colors.gray
              }
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchLabel}>
              <Body>Public Profile</Body>
              <Caption>Allow non-friends to discover your profile</Caption>
            </View>

            <Switch
              value={user?.preferences?.publicProfile === true}
              onValueChange={(value) => {
                // This would be part of the profile update
              }}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                user?.preferences?.publicProfile === true
                  ? theme.colors.primary
                  : theme.colors.gray
              }
            />
          </View>
        </Card>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Save Changes"
            onPress={handleSaveProfile}
            loading={loading}
            fullWidth
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            type="outline"
            style={styles.cancelButton}
            fullWidth
          />
        </View>
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
  sectionTitle: {
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
    paddingVertical: 12,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.black,
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 4,
  },
  notificationsCard: {
    marginBottom: theme.spacing.medium,
  },
  switchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  switchLabel: {
    flex: 1,
    marginRight: theme.spacing.medium,
  },
  timeContainer: {
    marginBottom: theme.spacing.medium,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: 12,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.black,
    flex: 1,
    marginRight: theme.spacing.small,
  },
  timeButton: {
    backgroundColor: theme.colors.lightGray,
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  timeHint: {
    marginTop: 4,
    color: theme.colors.darkGray,
  },
  privacyCard: {
    marginBottom: theme.spacing.large,
  },
  buttonContainer: {
    marginBottom: theme.spacing.large,
  },
  cancelButton: {
    marginTop: theme.spacing.medium,
  },
});

export default EditProfileScreen;

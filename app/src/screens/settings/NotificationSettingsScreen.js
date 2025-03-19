import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateUserProfile } from "../../store/slices/authSlice";
import { Container, Card, Button } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const NotificationSettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  // Notification settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [friendActivityAlerts, setFriendActivityAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState("weekly");
  const [hasPermission, setHasPermission] = useState(null);

  // Load settings from user profile
  useEffect(() => {
    if (user && user.preferences) {
      const prefs = user.preferences;
      setPushEnabled(prefs.pushEnabled !== false);
      setSoundEnabled(prefs.soundEnabled !== false);
      setVibrationEnabled(prefs.vibrationEnabled !== false);
      setDailyReminder(prefs.dailyReminder !== false);
      setReminderTime(prefs.reminderTime || "20:00");
      setStreakAlerts(prefs.streakAlerts !== false);
      setAchievementAlerts(prefs.achievementAlerts !== false);
      setFriendActivityAlerts(prefs.friendActivityAlerts !== false);
      setEmailDigest(prefs.emailDigest !== false);
      setEmailFrequency(prefs.emailFrequency || "weekly");
    }

    // Check notification permissions
    checkNotificationPermissions();
  }, [user]);

  // Check notification permissions
  const checkNotificationPermissions = async () => {
    if (Platform.OS === "android") {
      setHasPermission(true); // Android permissions are granted at app install time
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };

  // Request permissions if not already granted
  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setHasPermission(status === "granted");

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Notification permission is required to send you reminders. Please enable notifications in your device settings.",
          [{ text: "OK" }]
        );
      } else {
        // Toggle push notifications on if permissions granted
        setPushEnabled(true);
        saveSettings({ pushEnabled: true });
      }
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
    }
  };

  // Handle time change
  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === "ios");

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      setReminderTime(`${hours}:${minutes}`);

      // Save settings after time change
      saveSettings({
        dailyReminder: true,
        reminderTime: `${hours}:${minutes}`,
      });
    }
  };

  // Format time for display
  const formatTimeForDisplay = (time24) => {
    if (!time24 || !time24.includes(":")) return "";

    const [hoursStr, minutesStr] = time24.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = minutesStr.padStart(2, "0");

    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes} ${period}`;
  };

  // Parse time string to Date
  const parseTimeString = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Save notification settings
  const saveSettings = async (updatedSettings = {}) => {
    try {
      // Combine current settings with updates
      const settings = {
        pushEnabled,
        soundEnabled,
        vibrationEnabled,
        dailyReminder,
        reminderTime,
        streakAlerts,
        achievementAlerts,
        friendActivityAlerts,
        emailDigest,
        emailFrequency,
        ...updatedSettings,
      };

      // Update user profile
      await dispatch(
        updateUserProfile({
          preferences: {
            ...user.preferences,
            ...settings,
          },
        })
      ).unwrap();

      // Schedule or cancel notifications based on settings
      if (settings.pushEnabled && settings.dailyReminder) {
        scheduleReminder(settings.reminderTime);
      } else {
        cancelReminders();
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      Alert.alert(
        "Error",
        "Failed to save notification settings. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Schedule daily reminder
  const scheduleReminder = async (time) => {
    try {
      // Cancel existing reminders first
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!hasPermission) return;

      // Parse time
      const [hours, minutes] = time.split(":").map(Number);

      // Schedule notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Habit Reminder",
          body: "Time to complete your daily habits!",
          sound: soundEnabled,
          vibrate: vibrationEnabled ? [0, 250, 250, 250] : null,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    } catch (error) {
      console.error("Error scheduling reminder:", error);
    }
  };

  // Cancel all reminders
  const cancelReminders = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error canceling reminders:", error);
    }
  };

  // Toggle push notifications
  const togglePushNotifications = (value) => {
    if (value && !hasPermission) {
      requestPermissions();
    } else {
      setPushEnabled(value);
      saveSettings({ pushEnabled: value });

      if (!value) {
        // If disabling push notifications, cancel all scheduled notifications
        cancelReminders();
      } else if (dailyReminder) {
        // If enabling and daily reminder is on, schedule it
        scheduleReminder(reminderTime);
      }
    }
  };

  // Toggle daily reminder
  const toggleDailyReminder = (value) => {
    setDailyReminder(value);
    saveSettings({ dailyReminder: value });

    if (value && pushEnabled) {
      scheduleReminder(reminderTime);
    } else {
      cancelReminders();
    }
  };

  // Toggle sound
  const toggleSound = (value) => {
    setSoundEnabled(value);
    saveSettings({ soundEnabled: value });
  };

  // Toggle vibration
  const toggleVibration = (value) => {
    setVibrationEnabled(value);
    saveSettings({ vibrationEnabled: value });
  };

  // Toggle streak alerts
  const toggleStreakAlerts = (value) => {
    setStreakAlerts(value);
    saveSettings({ streakAlerts: value });
  };

  // Toggle achievement alerts
  const toggleAchievementAlerts = (value) => {
    setAchievementAlerts(value);
    saveSettings({ achievementAlerts: value });
  };

  // Toggle friend activity alerts
  const toggleFriendActivityAlerts = (value) => {
    setFriendActivityAlerts(value);
    saveSettings({ friendActivityAlerts: value });
  };

  // Toggle email digest
  const toggleEmailDigest = (value) => {
    setEmailDigest(value);
    saveSettings({ emailDigest: value });
  };

  // Change email frequency
  const changeEmailFrequency = (frequency) => {
    setEmailFrequency(frequency);
    saveSettings({ emailFrequency: frequency });
  };

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Push Notifications Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Push Notifications</Subheading>

          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Body style={styles.switchTitle}>Enable Push Notifications</Body>
              <Caption>Receive timely updates and reminders</Caption>
            </View>

            <Switch
              value={pushEnabled}
              onValueChange={togglePushNotifications}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                pushEnabled ? theme.colors.primary : theme.colors.gray
              }
            />
          </View>

          {!hasPermission && pushEnabled && (
            <View style={styles.permissionWarning}>
              <Ionicons name="warning" size={20} color={theme.colors.warning} />
              <Body style={styles.warningText}>
                Notification permission not granted.
                <TouchableOpacity onPress={requestPermissions}>
                  <Body style={styles.requestLink}> Request permission</Body>
                </TouchableOpacity>
              </Body>
            </View>
          )}

          {pushEnabled && (
            <>
              <View style={styles.divider} />

              <View style={styles.switchItem}>
                <View style={styles.switchInfo}>
                  <Body style={styles.switchTitle}>Sound</Body>
                  <Caption>Play sound with notifications</Caption>
                </View>

                <Switch
                  value={soundEnabled}
                  onValueChange={toggleSound}
                  trackColor={{
                    false: theme.colors.lightGray,
                    true: `${theme.colors.primary}80`,
                  }}
                  thumbColor={
                    soundEnabled ? theme.colors.primary : theme.colors.gray
                  }
                />
              </View>

              <View style={styles.switchItem}>
                <View style={styles.switchInfo}>
                  <Body style={styles.switchTitle}>Vibration</Body>
                  <Caption>Vibrate with notifications</Caption>
                </View>

                <Switch
                  value={vibrationEnabled}
                  onValueChange={toggleVibration}
                  trackColor={{
                    false: theme.colors.lightGray,
                    true: `${theme.colors.primary}80`,
                  }}
                  thumbColor={
                    vibrationEnabled ? theme.colors.primary : theme.colors.gray
                  }
                />
              </View>
            </>
          )}
        </Card>

        {/* Daily Reminder Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Daily Reminder</Subheading>

          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Body style={styles.switchTitle}>Daily Habit Reminder</Body>
              <Caption>Get a reminder to complete your habits</Caption>
            </View>

            <Switch
              value={dailyReminder}
              onValueChange={toggleDailyReminder}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                dailyReminder ? theme.colors.primary : theme.colors.gray
              }
              disabled={!pushEnabled}
            />
          </View>

          {dailyReminder && pushEnabled && (
            <>
              <View style={styles.divider} />

              <View style={styles.reminderTimeContainer}>
                <Body style={styles.reminderTimeLabel}>Reminder Time</Body>

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                  disabled={!pushEnabled}
                >
                  <Body style={styles.timeText}>
                    {formatTimeForDisplay(reminderTime)}
                  </Body>
                  <Ionicons
                    name="time"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={parseTimeString(reminderTime)}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
              </View>
            </>
          )}

          {!pushEnabled && (
            <Caption style={styles.disabledNote}>
              Enable push notifications to set up daily reminders
            </Caption>
          )}
        </Card>

        {/* Alert Types Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Alert Types</Subheading>

          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Body style={styles.switchTitle}>Streak Alerts</Body>
              <Caption>Get notified about streak milestones and risks</Caption>
            </View>

            <Switch
              value={streakAlerts}
              onValueChange={toggleStreakAlerts}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                streakAlerts ? theme.colors.primary : theme.colors.gray
              }
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Body style={styles.switchTitle}>Achievement Alerts</Body>
              <Caption>Get notified when you earn new achievements</Caption>
            </View>

            <Switch
              value={achievementAlerts}
              onValueChange={toggleAchievementAlerts}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                achievementAlerts ? theme.colors.primary : theme.colors.gray
              }
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Body style={styles.switchTitle}>Friend Activity</Body>
              <Caption>Get notified about your friends' progress</Caption>
            </View>

            <Switch
              value={friendActivityAlerts}
              onValueChange={toggleFriendActivityAlerts}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                friendActivityAlerts ? theme.colors.primary : theme.colors.gray
              }
              disabled={!pushEnabled}
            />
          </View>

          {!pushEnabled && (
            <Caption style={styles.disabledNote}>
              Enable push notifications to receive these alerts
            </Caption>
          )}
        </Card>

        {/* Email Notifications Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Email Notifications</Subheading>

          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Body style={styles.switchTitle}>Summary Digest</Body>
              <Caption>Receive a summary of your habit progress</Caption>
            </View>

            <Switch
              value={emailDigest}
              onValueChange={toggleEmailDigest}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                emailDigest ? theme.colors.primary : theme.colors.gray
              }
            />
          </View>

          {emailDigest && (
            <>
              <View style={styles.divider} />

              <Body style={styles.frequencyLabel}>Email Frequency</Body>

              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => changeEmailFrequency("daily")}
                >
                  <View
                    style={[
                      styles.radioButton,
                      emailFrequency === "daily" && styles.radioButtonSelected,
                    ]}
                  >
                    {emailFrequency === "daily" && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Body style={styles.radioLabel}>Daily</Body>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => changeEmailFrequency("weekly")}
                >
                  <View
                    style={[
                      styles.radioButton,
                      emailFrequency === "weekly" && styles.radioButtonSelected,
                    ]}
                  >
                    {emailFrequency === "weekly" && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Body style={styles.radioLabel}>Weekly</Body>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => changeEmailFrequency("monthly")}
                >
                  <View
                    style={[
                      styles.radioButton,
                      emailFrequency === "monthly" &&
                        styles.radioButtonSelected,
                    ]}
                  >
                    {emailFrequency === "monthly" && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Body style={styles.radioLabel}>Monthly</Body>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <Caption style={styles.infoText}>
            You can customize individual habit notifications from each habit's
            details screen.
          </Caption>
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
  card: {
    marginBottom: theme.spacing.medium,
  },
  cardTitle: {
    marginBottom: theme.spacing.medium,
  },
  switchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  switchInfo: {
    flex: 1,
    marginRight: theme.spacing.medium,
  },
  switchTitle: {
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginVertical: theme.spacing.small,
  },
  reminderTimeContainer: {
    marginTop: theme.spacing.small,
  },
  reminderTimeLabel: {
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: 12,
  },
  timeText: {
    color: theme.colors.black,
  },
  disabledNote: {
    color: theme.colors.error,
    marginTop: theme.spacing.small,
  },
  permissionWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.warning}10`,
    padding: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.medium,
  },
  warningText: {
    color: theme.colors.darkGray,
    flex: 1,
    marginLeft: theme.spacing.small,
    fontSize: theme.fontSizes.small,
  },
  requestLink: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  frequencyLabel: {
    marginBottom: theme.spacing.small,
  },
  radioGroup: {
    marginBottom: theme.spacing.small,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.gray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.small,
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  radioLabel: {
    color: theme.colors.black,
  },
  infoContainer: {
    marginBottom: theme.spacing.large,
  },
  infoText: {
    textAlign: "center",
    color: theme.colors.darkGray,
  },
});

export default NotificationSettingsScreen;

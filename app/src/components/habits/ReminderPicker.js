import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  Text,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Body, Caption } from "../common/Typography";
import { theme } from "../../theme";

const DAYS_OF_WEEK = [
  { value: 0, label: "S", fullLabel: "Sun" },
  { value: 1, label: "M", fullLabel: "Mon" },
  { value: 2, label: "T", fullLabel: "Tue" },
  { value: 3, label: "W", fullLabel: "Wed" },
  { value: 4, label: "T", fullLabel: "Thu" },
  { value: 5, label: "F", fullLabel: "Fri" },
  { value: 6, label: "S", fullLabel: "Sat" },
];

const ReminderPicker = ({ value, frequency, onChange }) => {
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleEnabledChange = (enabled) => {
    onChange({ ...value, enabled });
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");

    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      onChange({ ...value, time: timeString });
    }
  };

  const handleDayToggle = (day) => {
    let newDays;

    if (value.days.includes(day)) {
      // Remove day if already selected
      newDays = value.days.filter((d) => d !== day);
    } else {
      // Add day if not selected
      newDays = [...value.days, day].sort();
    }

    // Ensure at least one day is selected
    if (newDays.length === 0) {
      return;
    }

    onChange({
      ...value,
      days: newDays,
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    let period = "AM";
    let formattedHour = hour;

    if (hour >= 12) {
      period = "PM";
      formattedHour = hour === 12 ? 12 : hour - 12;
    }

    formattedHour = formattedHour === 0 ? 12 : formattedHour;

    return `${formattedHour}:${minutes.padStart(2, "0")} ${period}`;
  };

  // Get time as Date object for picker
  const getTimeAsDate = () => {
    const date = new Date();
    if (value.time) {
      const [hours, minutes] = value.time.split(":");
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
    }
    return date;
  };

  // Determine if we should show the days selection
  const shouldShowDays = value.enabled && frequency.type !== "daily";

  return (
    <View style={styles.container}>
      <View style={styles.enabledRow}>
        <Body>Remind me</Body>
        <Switch
          value={value.enabled}
          onValueChange={handleEnabledChange}
          trackColor={{
            false: theme.colors.lightGray,
            true: `${theme.colors.primary}80`,
          }}
          thumbColor={value.enabled ? theme.colors.primary : theme.colors.gray}
        />
      </View>

      {value.enabled && (
        <>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Body style={styles.timeText}>{formatTime(value.time)}</Body>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={getTimeAsDate()}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {shouldShowDays && (
            <View style={styles.daysContainer}>
              <Caption style={styles.daysLabel}>Remind me on:</Caption>
              <View style={styles.dayButtons}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayButton,
                      value.days.includes(day.value) &&
                        styles.selectedDayButton,
                    ]}
                    onPress={() => handleDayToggle(day.value)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        value.days.includes(day.value) &&
                          styles.selectedDayButtonText,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.small,
  },
  enabledRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.lightGray,
    padding: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.medium,
  },
  timeText: {
    marginLeft: theme.spacing.small,
  },
  daysContainer: {
    marginBottom: theme.spacing.medium,
  },
  daysLabel: {
    marginBottom: theme.spacing.small,
  },
  dayButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  selectedDayButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayButtonText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fonts.medium,
    color: theme.colors.darkGray,
  },
  selectedDayButtonText: {
    color: theme.colors.white,
  },
});

export default ReminderPicker;

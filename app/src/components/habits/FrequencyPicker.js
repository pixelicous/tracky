import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../common";
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

const FrequencyPicker = ({ value, onChange }) => {
  const handleFrequencyTypeChange = (type) => {
    let newFrequency = { ...value, type };

    // Set default days based on frequency type
    if (type === "daily") {
      newFrequency.days = [0, 1, 2, 3, 4, 5, 6]; // all days
    } else if (type === "weekly" && value.type !== "weekly") {
      newFrequency.days = [1, 3, 5]; // Mon, Wed, Fri
    }

    onChange(newFrequency);
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

  const handleTimesPerDayChange = (increment) => {
    const newTimesPerDay = Math.max(
      1,
      Math.min(value.timesPerDay + increment, 10)
    );
    onChange({
      ...value,
      timesPerDay: newTimesPerDay,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.frequencyTypeContainer}>
        <TouchableOpacity
          style={[
            styles.frequencyTypeButton,
            value.type === "daily" && styles.selectedFrequencyType,
          ]}
          onPress={() => handleFrequencyTypeChange("daily")}
        >
          <Body
            style={[
              styles.frequencyTypeText,
              value.type === "daily" && styles.selectedFrequencyTypeText,
            ]}
          >
            Daily
          </Body>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyTypeButton,
            value.type === "weekly" && styles.selectedFrequencyType,
          ]}
          onPress={() => handleFrequencyTypeChange("weekly")}
        >
          <Body
            style={[
              styles.frequencyTypeText,
              value.type === "weekly" && styles.selectedFrequencyTypeText,
            ]}
          >
            Weekly
          </Body>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyTypeButton,
            value.type === "custom" && styles.selectedFrequencyType,
          ]}
          onPress={() => handleFrequencyTypeChange("custom")}
        >
          <Body
            style={[
              styles.frequencyTypeText,
              value.type === "custom" && styles.selectedFrequencyTypeText,
            ]}
          >
            Custom
          </Body>
        </TouchableOpacity>
      </View>

      {value.type !== "daily" && (
        <View style={styles.daysContainer}>
          <Caption style={styles.daysLabel}>Select days:</Caption>
          <View style={styles.dayButtons}>
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  value.days.includes(day.value) && styles.selectedDayButton,
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

      <View style={styles.timesPerDayContainer}>
        <Caption>Times per day:</Caption>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => handleTimesPerDayChange(-1)}
            disabled={value.timesPerDay <= 1}
          >
            <Ionicons
              name="remove"
              size={20}
              color={
                value.timesPerDay <= 1 ? theme.colors.gray : theme.colors.black
              }
            />
          </TouchableOpacity>

          <Text style={styles.counterText}>{value.timesPerDay}</Text>

          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => handleTimesPerDayChange(1)}
            disabled={value.timesPerDay >= 10}
          >
            <Ionicons
              name="add"
              size={20}
              color={
                value.timesPerDay >= 10 ? theme.colors.gray : theme.colors.black
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.small,
  },
  frequencyTypeContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
  },
  frequencyTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.small,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    alignItems: "center",
  },
  frequencyTypeText: {
    color: theme.colors.darkGray,
  },
  selectedFrequencyType: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectedFrequencyTypeText: {
    color: theme.colors.white,
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
  timesPerDayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  counterText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.large,
    marginHorizontal: theme.spacing.medium,
  },
});

export default FrequencyPicker;

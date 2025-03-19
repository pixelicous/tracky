import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "../common";
import { Title, Body, Caption } from "../common/Typography";
import ColorPicker from "./ColorPicker";
import IconPicker from "./IconPicker";
import FrequencyPicker from "./FrequencyPicker";
import ReminderPicker from "./ReminderPicker";
import { theme } from "../../theme";

const HabitForm = ({ initialValues = {}, onSubmit, isEditing = false }) => {
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    icon: "checkmark-circle",
    color: theme.colors.primary,
    category: "personal",
    frequency: {
      type: "daily",
      days: [0, 1, 2, 3, 4, 5, 6], // all days of week
      timesPerDay: 1,
    },
    reminder: {
      enabled: true,
      time: "09:00",
      days: [0, 1, 2, 3, 4, 5, 6], // all days of week
    },
    ...initialValues,
  });

  const [errors, setErrors] = useState({});
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleFrequencyChange = (frequency) => {
    setFormValues((prev) => ({
      ...prev,
      frequency,
    }));
  };

  const handleReminderChange = (reminder) => {
    setFormValues((prev) => ({
      ...prev,
      reminder,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formValues.title) {
      newErrors.title = "Title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formValues);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Input
          label="Habit Title"
          value={formValues.title}
          onChangeText={(text) => handleChange("title", text)}
          placeholder="e.g., Drink water, Read a book..."
          error={errors.title}
        />

        <Input
          label="Description (optional)"
          value={formValues.description}
          onChangeText={(text) => handleChange("description", text)}
          placeholder="Why is this habit important to you?"
          multiline
          numberOfLines={3}
        />

        <View style={styles.row}>
          <View style={styles.iconColorContainer}>
            <Caption style={styles.label}>Icon</Caption>
            <View style={styles.iconButton}>
              <Button
                type="outline"
                title={formValues.icon ? "" : "Choose Icon"}
                onPress={() => setIconPickerVisible(true)}
                icon={
                  formValues.icon ? (
                    <Ionicons
                      name={formValues.icon}
                      size={24}
                      color={formValues.color}
                    />
                  ) : null
                }
                style={styles.iconButtonStyle}
              />
            </View>
          </View>

          <View style={styles.iconColorContainer}>
            <Caption style={styles.label}>Color</Caption>
            <Button
              type="outline"
              title=""
              onPress={() => setColorPickerVisible(true)}
              style={[styles.colorButton, { borderColor: formValues.color }]}
            >
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: formValues.color },
                ]}
              />
            </Button>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Caption style={styles.label}>How often?</Caption>
          <FrequencyPicker
            value={formValues.frequency}
            onChange={handleFrequencyChange}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Caption style={styles.label}>Reminders</Caption>
          <ReminderPicker
            value={formValues.reminder}
            frequency={formValues.frequency}
            onChange={handleReminderChange}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isEditing ? "Save Changes" : "Create Habit"}
            onPress={handleSubmit}
            fullWidth
          />
        </View>
      </View>

      {/* Color Picker Modal */}
      <ColorPicker
        visible={colorPickerVisible}
        initialColor={formValues.color}
        onSelect={(color) => {
          handleChange("color", color);
          setColorPickerVisible(false);
        }}
        onClose={() => setColorPickerVisible(false)}
      />

      {/* Icon Picker Modal */}
      <IconPicker
        visible={iconPickerVisible}
        initialIcon={formValues.icon}
        color={formValues.color}
        onSelect={(icon) => {
          handleChange("icon", icon);
          setIconPickerVisible(false);
        }}
        onClose={() => setIconPickerVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    paddingBottom: theme.spacing.xxl,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.medium,
  },
  iconColorContainer: {
    flex: 1,
    marginRight: theme.spacing.small,
  },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.small,
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.xs,
  },
  iconButton: {
    height: 48,
  },
  iconButtonStyle: {
    height: 48,
    justifyContent: "center",
  },
  colorButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sectionContainer: {
    marginBottom: theme.spacing.medium,
  },
  buttonContainer: {
    marginTop: theme.spacing.large,
  },
});

export default HabitForm;

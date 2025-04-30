import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../common";
import { Body, Caption } from "../common/Typography";
import { theme } from "../../theme";
import ProgressCircle from "./ProgressCircle";
import { getIconByHabitCategory } from "../../utils/iconUtils";

const HabitCard = ({ habit, onPress, onToggle, style, compact = false }) => {
  const { title, description, icon, color, category, progress } = habit;
  console.log("HabitCard rendering icon:", icon);
  const iconColor = color || theme.colors.primary;

  // Calculate completion status
  const isCompleted =
    progress?.history &&
    progress.history[new Date().toISOString().split("T")[0]];

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle && onToggle(habit);
  };

  if (compact) {
    return (
      <Card style={[styles.compactCard, style]} onPress={onPress}>
        <View style={styles.compactContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${iconColor}20` },
            ]}
          >
            {icon ? (
              /^\p{Emoji_Presentation}|\p{Emoji}\p{Emoji_Modifier_Base}$/u.test(
                icon
              ) ? (
                <Text style={{ fontSize: 20 }}>{icon}</Text>
              ) : (
                <Ionicons name={icon} size={20} color={iconColor} />
              )
            ) : (
              getIconByHabitCategory(category, 20, iconColor)
            )}
          </View>

          <View style={styles.compactTextContainer}>
            <Body numberOfLines={1}>{title}</Body>
          </View>

          <TouchableOpacity style={styles.compactToggle} onPress={handleToggle}>
            <View
              style={[
                styles.toggleButton,
                isCompleted ? styles.completedToggle : styles.pendingToggle,
              ]}
            >
              {isCompleted && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={theme.colors.white}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${iconColor}20` },
            ]}
          >
            {icon ? (
              /^\p{Emoji_Presentation}|\p{Emoji}\p{Emoji_Modifier_Base}$/u.test(
                icon
              ) ? (
                <Text style={{ fontSize: 24 }}>{icon}</Text>
              ) : (
                <Ionicons name={icon} size={24} color={iconColor} />
              )
            ) : (
              getIconByHabitCategory(category, 24, iconColor)
            )}
          </View>

          <View style={styles.textContainer}>
            <Body numberOfLines={1}>{title}</Body>
            {description && (
              <Caption numberOfLines={2} style={styles.description}>
                {description}
              </Caption>
            )}
          </View>
        </View>

        <View style={styles.rightContent}>
          {progress?.streak > 0 && (
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={14} color={theme.colors.warning} />
              <Caption style={styles.streakText}>{progress.streak}</Caption>
            </View>
          )}

          <TouchableOpacity style={styles.toggle} onPress={handleToggle}>
            <ProgressCircle
              size={36}
              strokeWidth={3}
              progress={isCompleted ? 1 : 0}
              color={isCompleted ? theme.colors.success : theme.colors.primary}
            >
              {isCompleted && (
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={theme.colors.white}
                />
              )}
            </ProgressCircle>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.small,
    padding: theme.spacing.medium,
    height: theme.habit.cardHeight,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rightContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.small,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  description: {
    marginTop: 2,
  },
  toggle: {
    padding: 4,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: `${theme.colors.warning}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
  },
  streakText: {
    marginLeft: 2,
    color: theme.colors.warning,
    fontFamily: theme.fonts.medium,
  },
  // Compact styles
  compactCard: {
    marginBottom: theme.spacing.small,
    padding: theme.spacing.small,
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.small,
  },
  compactToggle: {
    padding: 4,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  completedToggle: {
    backgroundColor: theme.colors.success,
  },
  pendingToggle: {
    backgroundColor: theme.colors.lightGray,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
});

export default HabitCard;

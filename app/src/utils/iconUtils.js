import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

export const getPremiumTabBarIcon = (focused) => {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons
        name={focused ? "diamond" : "diamond-outline"}
        size={24}
        color={focused ? theme.colors.secondary : theme.colors.darkGray}
      />
    </View>
  );
};

export const getIconByHabitCategory = (category, size = 24, color) => {
  const iconColor = color || theme.colors.primary;
  let iconName;

  switch (category) {
    case "health":
      iconName = "fitness";
      break;
    case "nutrition":
      iconName = "nutrition";
      break;
    case "fitness":
      iconName = "barbell";
      break;
    case "mindfulness":
      iconName = "leaf";
      break;
    case "productivity":
      iconName = "briefcase";
      break;
    case "learning":
      iconName = "book";
      break;
    case "creativity":
      iconName = "color-palette";
      break;
    case "social":
      iconName = "people";
      break;
    case "finance":
      iconName = "cash";
      break;
    case "sleep":
      iconName = "moon";
      break;
    case "personal":
      iconName = "person";
      break;
    default:
      iconName = "checkmark-circle";
  }

  return <Ionicons name={iconName} size={size} color={iconColor} />;
};

export const getAchievementIcon = (type, size = 24, color) => {
  const iconColor = color || theme.colors.warning;
  let iconName;

  switch (type) {
    case "streak":
      iconName = "flame";
      break;
    case "completion":
      iconName = "checkmark-done-circle";
      break;
    case "variety":
      iconName = "grid";
      break;
    case "consistency":
      iconName = "calendar";
      break;
    case "social":
      iconName = "people";
      break;
    case "challenge":
      iconName = "trophy";
      break;
    case "milestone":
      iconName = "flag";
      break;
    case "special":
      iconName = "star";
      break;
    default:
      iconName = "ribbon";
  }

  return <Ionicons name={iconName} size={size} color={iconColor} />;
};

export default {
  getPremiumTabBarIcon,
  getIconByHabitCategory,
  getAchievementIcon,
};

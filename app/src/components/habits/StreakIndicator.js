import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";

const StreakIndicator = ({
  count,
  record = 0,
  showAnimation = false,
  size = "medium",
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showAnimation) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [count, showAnimation]);

  // Size styling
  const containerStyle = [
    styles.container,
    size === "small" && styles.smallContainer,
    size === "large" && styles.largeContainer,
  ];

  const iconSize = size === "small" ? 14 : size === "large" ? 24 : 18;
  const fontSize =
    size === "small"
      ? theme.fontSizes.small
      : size === "large"
      ? theme.fontSizes.xl
      : theme.fontSizes.medium;

  return (
    <Animated.View
      style={[...containerStyle, { transform: [{ scale: scaleAnim }] }]}
    >
      <Ionicons name="flame" size={iconSize} color={theme.colors.warning} />
      <Text style={[styles.count, { fontSize }]}>{count}</Text>

      {record > 0 && size !== "small" && (
        <Text style={styles.record}>Best: {record}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.warning}20`,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.xs,
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
  },
  largeContainer: {
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.large,
  },
  count: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.warning,
    marginLeft: 4,
  },
  record: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.darkGray,
    marginLeft: 8,
  },
});

export default StreakIndicator;

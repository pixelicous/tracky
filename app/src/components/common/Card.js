import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { theme } from "../../theme";

const Card = ({ children, style, onPress, disabled = false, ...props }) => {
  const currentTheme = useSelector((state) => state.ui.theme);
  const currentThemeColors =
    currentTheme === "dark" ? theme.colors.darkMode : theme.colors;
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.card, { backgroundColor: currentThemeColors.card }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    ...theme.shadows.small,
  },
});

export default Card;

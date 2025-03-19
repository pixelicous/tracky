import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../../theme";

const Card = ({ children, style, onPress, disabled = false, ...props }) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.card, style]}
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    ...theme.shadows.small,
  },
});

export default Card;

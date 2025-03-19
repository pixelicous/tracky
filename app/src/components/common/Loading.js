import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { theme } from "../../theme";

const Loading = ({
  size = "large",
  color = theme.colors.primary,
  text,
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  text: {
    marginTop: theme.spacing.small,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.darkGray,
  },
});

export default Loading;

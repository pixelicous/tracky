import React, { useContext } from "react";
import { Text, StyleSheet, useColorScheme } from "react-native";
import { theme } from "../../theme";
import { useSelector } from "react-redux";

// Helper function to get the current theme colors
const useThemeColors = () => {
  const currentTheme = useSelector((state) => state.ui.theme);
  const systemColorScheme = useColorScheme();
  const isDarkMode =
    currentTheme === "dark" ||
    (currentTheme === "system" && systemColorScheme === "dark");

  return isDarkMode ? theme.colors.darkMode : theme.colors;
};

export const Title = ({ children, style, center, ...props }) => {
  const currentThemeColors = useThemeColors();
  return (
    <Text
      style={[
        styles.title,
        { color: currentThemeColors.black },
        center && styles.textCenter,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Heading = ({ children, style, center, ...props }) => {
  const currentThemeColors = useThemeColors();
  return (
    <Text
      style={[
        styles.heading,
        { color: currentThemeColors.black },
        center && styles.textCenter,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Subheading = ({ children, style, center, ...props }) => {
  const currentThemeColors = useThemeColors();
  return (
    <Text
      style={[
        styles.subheading,
        { color: currentThemeColors.black },
        center && styles.textCenter,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Body = ({ children, style, center, bold, ...props }) => {
  const currentThemeColors = useThemeColors();
  return (
    <Text
      style={[
        styles.body,
        { color: currentThemeColors.black },
        center && styles.textCenter,
        bold && styles.bodyBold,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Caption = ({ children, style, center, ...props }) => {
  const currentThemeColors = useThemeColors();
  return (
    <Text
      style={[
        styles.caption,
        { color: currentThemeColors.darkGray },
        center && styles.textCenter,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.title,
    marginVertical: theme.spacing.small,
  },
  heading: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.xxl,
    marginVertical: theme.spacing.small,
  },
  subheading: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.large,
    marginVertical: theme.spacing.xs,
  },
  body: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: theme.fonts.semiBold,
  },
  caption: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.small,
  },
  textCenter: {
    textAlign: "center",
  },
});

export default { Title, Heading, Subheading, Body, Caption };

import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

export const Title = ({ children, style, center, ...props }) => (
  <Text style={[styles.title, center && styles.textCenter, style]} {...props}>
    {children}
  </Text>
);

export const Heading = ({ children, style, center, ...props }) => (
  <Text style={[styles.heading, center && styles.textCenter, style]} {...props}>
    {children}
  </Text>
);

export const Subheading = ({ children, style, center, ...props }) => (
  <Text
    style={[styles.subheading, center && styles.textCenter, style]}
    {...props}
  >
    {children}
  </Text>
);

export const Body = ({ children, style, center, bold, ...props }) => (
  <Text
    style={[
      styles.body,
      center && styles.textCenter,
      bold && styles.bodyBold,
      style,
    ]}
    {...props}
  >
    {children}
  </Text>
);

export const Caption = ({ children, style, center, ...props }) => (
  <Text style={[styles.caption, center && styles.textCenter, style]} {...props}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.title,
    color: theme.colors.black,
    marginVertical: theme.spacing.small,
  },
  heading: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.xxl,
    color: theme.colors.black,
    marginVertical: theme.spacing.small,
  },
  subheading: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.large,
    color: theme.colors.black,
    marginVertical: theme.spacing.xs,
  },
  body: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.black,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: theme.fonts.semiBold,
  },
  caption: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.small,
    color: theme.colors.darkGray,
  },
  textCenter: {
    textAlign: "center",
  },
});

export default { Title, Heading, Subheading, Body, Caption };

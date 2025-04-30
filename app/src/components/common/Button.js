import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { theme } from "../../theme";

const Button = ({
  title,
  onPress,
  type = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    let buttonStyle = [styles.button];

    // Button type
    if (type === "primary") {
      buttonStyle.push(styles.primaryButton);
    } else if (type === "secondary") {
      buttonStyle.push(styles.secondaryButton);
    } else if (type === "outline") {
      buttonStyle.push(styles.outlineButton);
    } else if (type === "text") {
      buttonStyle.push(styles.textButton);
    }

    // Button size
    if (size === "small") {
      buttonStyle.push(styles.smallButton);
    } else if (size === "large") {
      buttonStyle.push(styles.largeButton);
    }

    // Full width
    if (fullWidth) {
      buttonStyle.push(styles.fullWidth);
    }

    // Disabled
    if (disabled || loading) {
      buttonStyle.push(styles.disabledButton);
    }

    return buttonStyle;
  };

  const getTextStyle = () => {
    let textStyleArray = [styles.buttonText];

    // Text color based on button type
    if (type === "primary") {
      textStyleArray.push(styles.primaryText);
    } else if (type === "secondary") {
      textStyleArray.push(styles.secondaryText);
    } else if (type === "outline") {
      textStyleArray.push(styles.outlineText);
    } else if (type === "text") {
      textStyleArray.push(styles.textOnlyText);
    }

    // Text size based on button size
    if (size === "small") {
      textStyleArray.push(styles.smallText);
    } else if (size === "large") {
      textStyleArray.push(styles.largeText);
    }

    // Disabled
    if (disabled || loading) {
      textStyleArray.push(styles.disabledText);
    }

    return textStyleArray;
  };

  const currentTheme = useSelector((state) => state.ui.theme);
  const currentThemeColors =
    currentTheme === "dark" ? theme.colors.darkMode : theme.colors;

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            type === "primary"
              ? currentTheme === "dark"
                ? currentThemeColors.white
                : theme.colors.white
              : currentTheme === "dark"
              ? currentThemeColors.primary
              : theme.colors.primary
          }
          size="small"
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === "left" && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === "right" && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
    ...theme.shadows.small,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  textButton: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: "100%",
  },
  disabledButton: {
    ...theme.shadows.none,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.medium,
    textAlign: "center",
  },
  primaryText: {},
  secondaryText: {},
  outlineText: {},
  textOnlyText: {},
  smallText: {
    fontSize: theme.fontSizes.small,
  },
  largeText: {
    fontSize: theme.fontSizes.large,
  },
  disabledText: {},
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;

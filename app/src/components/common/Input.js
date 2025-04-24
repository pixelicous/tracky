import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { theme } from "../../theme";

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  icon,
  error,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const currentTheme = useSelector((state) => state.ui.theme);
  const currentThemeColors =
    currentTheme === "dark" ? theme.colors.darkMode : theme.colors;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          multiline && styles.multilineInput,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            secureTextEntry && styles.inputWithButton,
            multiline && styles.multilineTextInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            currentTheme === "dark"
              ? currentThemeColors.gray
              : theme.colors.gray
          }
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={20}
              color={
                currentTheme === "dark"
                  ? currentThemeColors.darkGray
                  : theme.colors.darkGray
              }
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.medium,
  },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.small,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: theme.borderRadius.small,
  },
  inputFocused: {},
  inputError: {},
  multilineInput: {
    minHeight: 100,
    alignItems: "flex-start",
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputWithIcon: {
    paddingLeft: 12,
  },
  inputWithButton: {
    paddingRight: 40,
  },
  multilineTextInput: {
    textAlignVertical: "top",
    paddingTop: 12,
  },
  iconContainer: {
    paddingLeft: 12,
  },
  visibilityButton: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
  },
  errorText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.small,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});

export default Input;

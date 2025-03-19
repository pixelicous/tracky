import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "../../store/slices/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { Container, Button, Input } from "../../components/common";
import { Title, Body, Caption } from "../../components/common/Typography";
import { theme } from "../../theme";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleResetPassword = async () => {
    if (validateForm()) {
      try {
        await dispatch(resetPassword(email)).unwrap();
        Alert.alert(
          "Reset Email Sent",
          "Check your email for instructions to reset your password.",
          [{ text: "OK", onPress: () => navigation.navigate("SignIn") }]
        );
      } catch (err) {
        // Error is already handled in the reducer
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Title style={styles.title}>Forgot Password</Title>
          <Body style={styles.subtitle}>
            Enter your email and we'll send you instructions to reset your
            password
          </Body>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={theme.colors.error}
              />
              <Body style={styles.errorText}>{error}</Body>
            </View>
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            icon={
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.darkGray}
              />
            }
          />

          <Button
            title="Reset Password"
            onPress={handleResetPassword}
            loading={isLoading}
            style={styles.button}
            fullWidth
          />

          <TouchableOpacity
            style={styles.backToSignIn}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Body style={styles.backToSignInText}>Back to Sign In</Body>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.large,
  },
  backButton: {
    marginBottom: theme.spacing.large,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  subtitle: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.large,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.error}20`,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.medium,
  },
  errorText: {
    color: theme.colors.error,
    marginLeft: theme.spacing.small,
  },
  button: {
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.large,
  },
  backToSignIn: {
    alignItems: "center",
  },
  backToSignInText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
});

export default ForgotPasswordScreen;

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "../../store/slices/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { Container, Button, Input } from "../../components/common";
import { Title, Body, Caption } from "../../components/common/Typography";
import { theme } from "../../theme";

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = () => {
    if (validateForm()) {
      dispatch(signIn({ email, password }));
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
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../assets/images/logo.png")} // You'll need to create this
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <Title style={styles.title}>Welcome Back</Title>
          <Body style={styles.subtitle}>
            Sign in to continue tracking your habits
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

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
            icon={
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.darkGray}
              />
            }
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Caption>Forgot Password?</Caption>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={isLoading}
            style={styles.button}
            fullWidth
          />

          <View style={styles.signupContainer}>
            <Body>Don't have an account? </Body>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Body style={styles.signupText}>Sign Up</Body>
            </TouchableOpacity>
          </View>
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
  logoContainer: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
  },
  formContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    textAlign: "center",
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.large,
  },
  button: {
    marginBottom: theme.spacing.large,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.medium,
  },
  signupText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
});

export default SignInScreen;

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
import { registerUser, signInWithGoogle } from "../../store/slices/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { Container, Button, Input } from "../../components/common";
import { Title, Body, Caption } from "../../components/common/Typography";
import { theme } from "../../theme";

const SignUpScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Name validation
    if (!displayName) {
      newErrors.displayName = "Name is required";
      isValid = false;
    }

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

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = () => {
    if (validateForm()) {
      dispatch(registerUser({ email, password, displayName }));
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
          <Title style={styles.title}>Create Account</Title>
          <Body style={styles.subtitle}>
            Sign up to start your habit journey
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
            label="Full Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            error={errors.displayName}
            icon={
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.colors.darkGray}
              />
            }
          />

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
            placeholder="Create a password"
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

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
            error={errors.confirmPassword}
            icon={
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.darkGray}
              />
            }
          />

          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={isLoading}
            style={styles.button}
            fullWidth
          />

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Body style={styles.dividerText}>or</Body>
            <View style={styles.divider} />
          </View>

          {Platform.OS === "android" ? (
            <Button
              title="Sign up with Google"
              onPress={() => {
                dispatch(signInWithGoogle())
                  .unwrap()
                  .then((userData) => {
                    // Check if this was a new account creation
                    if (userData && userData.isNewAccount) {
                      // Show a welcome message for new users
                      alert(
                        "Welcome! Your account has been created successfully with Google Sign-In."
                      );
                    }
                  })
                  .catch((error) => {
                    console.error("Google Sign-In failed:", error);
                    // Error is already handled in the reducer
                  });
              }}
              style={styles.googleButton}
              textStyle={styles.googleButtonText}
              icon={
                <Ionicons
                  name="logo-google"
                  size={20}
                  color="#DB4437"
                  style={styles.googleIcon}
                />
              }
              fullWidth
            />
          ) : (
            <Body style={styles.comingSoon}>
              Sign up with iCloud coming soon
            </Body>
          )}

          <View style={styles.signinContainer}>
            <Body>Already have an account? </Body>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Body style={styles.signinText}>Sign In</Body>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.medium,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.lightGray,
  },
  dividerText: {
    marginHorizontal: theme.spacing.medium,
    color: theme.colors.darkGray,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    marginBottom: theme.spacing.medium,
  },
  googleButtonText: {
    color: theme.colors.black,
  },
  googleIcon: {
    marginRight: theme.spacing.small,
  },
  comingSoon: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.medium,
  },
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
    marginTop: theme.spacing.large,
    marginBottom: theme.spacing.large,
  },
  logo: {
    width: 100,
    height: 100,
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
  button: {
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.small,
  },
  signinContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signinText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
});

export default SignUpScreen;

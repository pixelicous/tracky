import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { setTheme } from "../../store/slices/uiSlice";
import { updateUserProfile } from "../../store/slices/authSlice";
import { Container, Card } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const ThemeSettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state) => state.ui.theme);
  const { user } = useSelector((state) => state.auth);
  const { subscription } = useSelector((state) => state.premium);

  const [selectedTheme, setSelectedTheme] = useState(currentTheme || "default");
  const [darkMode, setDarkMode] = useState(currentTheme === "dark");
  const [systemTheme, setSystemTheme] = useState(currentTheme === "system");

  // Theme options
  const themeOptions = [
    {
      id: "default",
      name: "Default",
      icon: "color-palette",
      color: theme.colors.primary,
      premium: false,
    },
    {
      id: "ocean",
      name: "Ocean",
      icon: "water",
      color: "#4A90E2",
      premium: false,
    },
    {
      id: "forest",
      name: "Forest",
      icon: "leaf",
      color: "#27AE60",
      premium: false,
    },
    {
      id: "sunset",
      name: "Sunset",
      icon: "sunny",
      color: "#F39C12",
      premium: false,
    },
    {
      id: "lavender",
      name: "Lavender",
      icon: "flower",
      color: "#9B59B6",
      premium: true,
    },
    {
      id: "midnight",
      name: "Midnight",
      icon: "moon",
      color: "#34495E",
      premium: true,
    },
    {
      id: "candy",
      name: "Candy",
      icon: "ice-cream",
      color: "#E91E63",
      premium: true,
    },
    {
      id: "neon",
      name: "Neon",
      icon: "flash",
      color: "#00FFC6",
      premium: true,
    },
  ];

  // Handle theme selection
  const handleThemeSelect = (themeId) => {
    // Check if this is a premium theme
    const isPremiumTheme = themeOptions.find((t) => t.id === themeId)?.premium;

    if (isPremiumTheme && !subscription.isSubscribed) {
      Alert.alert(
        "Premium Theme",
        "This theme is available only for premium users. Upgrade to access exclusive themes.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () =>
              navigation.navigate("PremiumTab", { screen: "Subscription" }),
          },
        ]
      );
      return;
    }

    setSelectedTheme(themeId);
    setDarkMode(false);
    setSystemTheme(false);

    // Apply theme
    dispatch(setTheme(themeId));

    // Save preference
    saveThemePreference(themeId);
  };

  // Handle dark mode toggle
  const toggleDarkMode = (value) => {
    setDarkMode(value);
    setSystemTheme(false);

    if (value) {
      dispatch(setTheme("dark"));
      saveThemePreference("dark");
    } else {
      dispatch(setTheme(selectedTheme));
      saveThemePreference(selectedTheme);
    }
  };

  // Handle system theme toggle
  const toggleSystemTheme = (value) => {
    setSystemTheme(value);

    if (value) {
      setDarkMode(false);
      dispatch(setTheme("system"));
      saveThemePreference("system");
    } else {
      dispatch(setTheme(selectedTheme));
      saveThemePreference(selectedTheme);
    }
  };

  // Save theme preference to user profile
  const saveThemePreference = async (themeId) => {
    try {
      await dispatch(
        updateUserProfile({
          preferences: {
            ...user.preferences,
            theme: themeId,
          },
        })
      ).unwrap();
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.medium,
    },
    card: {
      marginBottom: theme.spacing.medium,
    },
    cardTitle: {
      marginBottom: theme.spacing.small,
      textAlign: "center",
    },
    cardSubtitle: {
      textAlign: "center",
      color: theme.colors.gray,
      marginBottom: theme.spacing.medium,
    },
    switchItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.medium,
    },
    switchInfo: {
      flex: 1,
    },
    switchTitle: {
      marginBottom: theme.spacing.xs,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    themeOption: {
      width: "48%",
      marginBottom: theme.spacing.medium,
      alignItems: "center",
      padding: theme.spacing.small,
      borderRadius: theme.radii.md,
      borderWidth: 2,
      borderColor: "transparent",
    },
    selectedTheme: {
      borderColor: theme.colors.primary,
    },
    lockedTheme: {
      opacity: 0.5,
    },
    themeColor: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.xs,
    },
    themeName: {
      textAlign: "center",
    },
    selectedThemeName: {
      fontWeight: "bold",
    },
    lockedThemeName: {
      fontStyle: "italic",
    },
    lockIconContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 20,
    },
  });

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Toggle Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Theme Settings</Subheading>

          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Body style={styles.switchTitle}>Dark Mode</Body>
              <Caption>Use dark theme for the entire app</Caption>
            </View>

            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={darkMode ? theme.colors.primary : theme.colors.gray}
              disabled={systemTheme}
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Body style={styles.switchTitle}>Use System Theme</Body>
              <Caption>Follow your device's dark/light mode setting</Caption>
            </View>

            <Switch
              value={systemTheme}
              onValueChange={toggleSystemTheme}
              trackColor={{
                false: theme.colors.lightGray,
                true: `${theme.colors.primary}80`,
              }}
              thumbColor={
                systemTheme ? theme.colors.primary : theme.colors.gray
              }
            />
          </View>
        </Card>

        {/* Color Themes Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Color Themes</Subheading>
          <Caption style={styles.cardSubtitle}>
            Select a color theme for the app
          </Caption>

          <View style={styles.themeGrid}>
            {themeOptions.map((themeOption) => {
              const isPremiumLocked =
                themeOption.premium && !subscription.isSubscribed;

              return (
                <TouchableOpacity
                  key={themeOption.id}
                  style={[
                    styles.themeOption,
                    selectedTheme === themeOption.id && styles.selectedTheme,
                    isPremiumLocked && styles.lockedTheme,
                  ]}
                  onPress={() => handleThemeSelect(themeOption.id)}
                  disabled={systemTheme || darkMode}
                >
                  <View
                    style={[
                      styles.themeColor,
                      { backgroundColor: themeOption.color },
                    ]}
                  >
                    <Ionicons
                      name={themeOption.icon}
                      size={20}
                      color="#FFFFFF"
                    />

                    {isPremiumLocked && (
                      <View style={styles.lockIconContainer}>
                        <Ionicons
                          name="lock-closed"
                          size={12}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </View>

                  <Caption
                    style={[
                      styles.themeName,
                      selectedTheme === themeOption.id &&
                        styles.selectedThemeName,
                      isPremiumLocked && styles.lockedThemeName,
                    ]}
                  >
                    {themeOption.name}
                  </Caption>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </Container>
  );
};

export default ThemeSettingsScreen;

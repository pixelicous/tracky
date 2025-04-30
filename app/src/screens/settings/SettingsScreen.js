import React from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "../../store/slices/authSlice";
import { setTheme } from "../../store/slices/uiSlice";
import Container from "../../components/common/Container";
import { Card } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme: appTheme } = useSelector((state) => state.ui);
  const { subscription } = useSelector((state) => state.premium);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          dispatch(signOut());
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear App Data",
      "This will reset all app preferences. Your account and habits will not be affected. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(
                "Success",
                "App data cleared successfully. Please restart the app."
              );
            } catch (error) {
              Alert.alert("Error", "Failed to clear app data.");
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = true,
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
      </View>

      <View style={styles.settingContent}>
        <Body style={styles.settingTitle}>{title}</Body>
        {subtitle && (
          <Caption style={styles.settingSubtitle}>{subtitle}</Caption>
        )}
      </View>

      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.darkGray}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Container>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Account</Subheading>

          <Card style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.profileItem}
              onPress={() => navigation.navigate("Profile")}
            >
              <View style={styles.profileAvatar}>
                {user?.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons
                      name="person"
                      size={30}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              </View>

              <View style={styles.profileInfo}>
                <Body style={styles.profileName}>
                  {user?.displayName || "User"}
                </Body>
                <Caption>{user?.email || ""}</Caption>

                <View style={styles.subscriptionBadge}>
                  <Caption style={styles.subscriptionText}>
                    {subscription.isSubscribed ? "Premium" : "Free"} Plan
                  </Caption>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.darkGray}
              />
            </TouchableOpacity>

            {renderSettingItem({
              icon: "person-outline",
              title: "Edit Profile",
              onPress: () => navigation.navigate("EditProfile"),
            })}

            {renderSettingItem({
              icon: subscription.isSubscribed ? "diamond" : "diamond-outline",
              title: subscription.isSubscribed
                ? "Manage Subscription"
                : "Upgrade to Premium",
              subtitle: subscription.isSubscribed
                ? `Premium plan • Expires ${new Date(
                    subscription.expiryDate
                  ).toLocaleDateString()}`
                : "Get more features and remove ads",
              onPress: () =>
                navigation.navigate("PremiumTab", {
                  screen: subscription.isSubscribed
                    ? "PremiumDashboard"
                    : "Subscription",
                }),
            })}
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Preferences</Subheading>

          <Card style={styles.sectionCard}>
            {renderSettingItem({
              icon: "notifications-outline",
              title: "Notifications",
              subtitle: "Manage reminder settings",
              onPress: () => navigation.navigate("NotificationSettings"),
            })}

            {renderSettingItem({
              icon: "color-palette-outline",
              title: "Appearance",
              subtitle: "Theme, colors, and display",
              onPress: () => navigation.navigate("ThemeSettings"),
            })}

            {renderSettingItem({
              icon: "moon-outline",
              title: "Dark Mode",
              rightElement: (
                <Switch
                  value={appTheme === "dark"}
                  onValueChange={(value) =>
                    dispatch(setTheme(value ? "dark" : "default"))
                  }
                  trackColor={{
                    false: theme.colors.lightGray,
                    true: `${theme.colors.primary}80`,
                  }}
                  thumbColor={
                    appTheme === "dark"
                      ? theme.colors.primary
                      : theme.colors.gray
                  }
                />
              ),
              showChevron: false,
            })}
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Support</Subheading>

          <Card style={styles.sectionCard}>
            {renderSettingItem({
              icon: "help-circle-outline",
              title: "Help & Support",
              subtitle: "FAQ, contact us, report issues",
              onPress: () => {
                /* Open help website or in-app support */
              },
            })}

            {renderSettingItem({
              icon: "star-outline",
              title: "Rate the App",
              subtitle: "If you enjoy using the app",
              onPress: () => {
                /* Open app store rating */
              },
            })}

            {renderSettingItem({
              icon: "share-social-outline",
              title: "Share with Friends",
              subtitle: "Invite friends to join you",
              onPress: () => {
                /* Open share dialog */
              },
            })}

            {renderSettingItem({
              icon: "information-circle-outline",
              title: "About",
              subtitle: "App version, terms, privacy",
              onPress: () => navigation.navigate("About"),
            })}
          </Card>
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Card style={styles.sectionCard}>
            {renderSettingItem({
              icon: "refresh-outline",
              title: "Clear App Data",
              subtitle: "Reset app preferences",
              onPress: handleClearData,
            })}

            {renderSettingItem({
              icon: "log-out-outline",
              title: "Sign Out",
              onPress: handleSignOut,
            })}
          </Card>
        </View>

        <View style={styles.footer}>
          <Caption style={styles.versionText}>Version 1.0.0</Caption>
          <Caption style={styles.copyrightText}>
            © 2023 Daily Habits Tracker
          </Caption>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.large,
  },
  sectionTitle: {
    marginBottom: theme.spacing.small,
    marginLeft: theme.spacing.xs,
  },
  sectionCard: {
    padding: 0,
    overflow: "hidden",
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  profileAvatar: {
    marginRight: theme.spacing.medium,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.large,
    marginBottom: 2,
  },
  subscriptionBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: theme.spacing.xs,
  },
  subscriptionText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.medium,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: theme.fontSizes.small,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    alignItems: "center",
  },
  versionText: {
    marginBottom: 4,
  },
  copyrightText: {
    color: theme.colors.gray,
  },
});

export default SettingsScreen;

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { getPremiumTabBarIcon } from "../utils/iconUtils";

// Auth Screens
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import SignInScreen from "../screens/auth/SignInScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// Main App Screens
import DashboardScreen from "../screens/habits/DashboardScreen";
import HabitListScreen from "../screens/habits/HabitListScreen";
import HabitDetailScreen from "../screens/habits/HabitDetailScreen";
import AddHabitScreen from "../screens/habits/AddHabitScreen";
import EditHabitScreen from "../screens/habits/EditHabitScreen";

// Progress Screens
import ProgressDashboardScreen from "../screens/progress/ProgressDashboardScreen";
import StatsDetailScreen from "../screens/progress/StatsDetailScreen";
import AchievementsScreen from "../screens/progress/AchievementsScreen";

// Social Screens
import SocialDashboardScreen from "../screens/social/SocialDashboardScreen";
import FriendsScreen from "../screens/social/FriendsScreen";
import AddFriendScreen from "../screens/social/AddFriendScreen";
import FriendProfileScreen from "../screens/social/FriendProfileScreen";
import ChallengesScreen from "../screens/social/ChallengesScreen";
import ChallengeDetailScreen from "../screens/social/ChallengeDetailScreen";
import CreateChallengeScreen from "../screens/social/CreateChallengeScreen";

// Settings Screens
import SettingsScreen from "../screens/settings/SettingsScreen";
import ProfileScreen from "../screens/settings/ProfileScreen";
import EditProfileScreen from "../screens/settings/EditProfileScreen";
import NotificationSettingsScreen from "../screens/settings/NotificationSettingsScreen";
import ThemeSettingsScreen from "../screens/settings/ThemeSettingsScreen";
import AboutScreen from "../screens/settings/AboutScreen";

// Premium Screens
import PremiumDashboardScreen from "../screens/premium/PremiumDashboardScreen";
import SubscriptionScreen from "../screens/premium/SubscriptionScreen";
import StoreScreen from "../screens/premium/StoreScreen";
import PremiumFeaturesScreen from "../screens/premium/PremiumFeaturesScreen";

// Create navigation stacks
const AuthStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();
const HabitsStack = createNativeStackNavigator();
const ProgressStack = createNativeStackNavigator();
const SocialStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const PremiumStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    <AuthStack.Screen name="SignIn" component={SignInScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

// Dashboard Stack Navigator
const DashboardNavigator = () => (
  <DashboardStack.Navigator
    screenOptions={{
      headerTitleStyle: {
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.black,
        fontSize: theme.fontSizes.large,
      },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <DashboardStack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
    <DashboardStack.Screen name="HabitDetail" component={HabitDetailScreen} />
    <DashboardStack.Screen
      name="AddHabit"
      component={AddHabitScreen}
      options={{ presentation: "modal", title: "Add New Habit" }}
    />
  </DashboardStack.Navigator>
);

// Habits Stack Navigator
const HabitsNavigator = () => (
  <HabitsStack.Navigator
    screenOptions={{
      headerTitleStyle: {
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.black,
        fontSize: theme.fontSizes.large,
      },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <HabitsStack.Screen
      name="HabitsList"
      component={HabitListScreen}
      options={{ title: "My Habits" }}
    />
    <HabitsStack.Screen name="HabitDetail" component={HabitDetailScreen} />
    <HabitsStack.Screen
      name="AddHabit"
      component={AddHabitScreen}
      options={{ presentation: "modal", title: "Add New Habit" }}
    />
    <HabitsStack.Screen
      name="EditHabit"
      component={EditHabitScreen}
      options={{ title: "Edit Habit" }}
    />
  </HabitsStack.Navigator>
);

// Progress Stack Navigator
const ProgressNavigator = () => (
  <ProgressStack.Navigator
    screenOptions={{
      headerTitleStyle: {
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.black,
        fontSize: theme.fontSizes.large,
      },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <ProgressStack.Screen
      name="ProgressDashboard"
      component={ProgressDashboardScreen}
      options={{ title: "Progress" }}
    />
    <ProgressStack.Screen
      name="StatsDetail"
      component={StatsDetailScreen}
      options={{ title: "Statistics" }}
    />
    <ProgressStack.Screen
      name="Achievements"
      component={AchievementsScreen}
      options={{ title: "Achievements" }}
    />
  </ProgressStack.Navigator>
);

// Social Stack Navigator
const SocialNavigator = () => (
  <SocialStack.Navigator
    screenOptions={{
      headerTitleStyle: {
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.black,
        fontSize: theme.fontSizes.large,
      },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <SocialStack.Screen
      name="SocialDashboard"
      component={SocialDashboardScreen}
      options={{ title: "Community" }}
    />
    <SocialStack.Screen
      name="Friends"
      component={FriendsScreen}
      options={{ title: "Friends" }}
    />
    <SocialStack.Screen
      name="AddFriend"
      component={AddFriendScreen}
      options={{ title: "Add Friend" }}
    />
    <SocialStack.Screen
      name="FriendProfile"
      component={FriendProfileScreen}
      options={({ route }) => ({ title: route.params?.name || "Profile" })}
    />
    <SocialStack.Screen
      name="Challenges"
      component={ChallengesScreen}
      options={{ title: "Challenges" }}
    />
    <SocialStack.Screen
      name="ChallengeDetail"
      component={ChallengeDetailScreen}
      options={({ route }) => ({ title: route.params?.title || "Challenge" })}
    />
    <SocialStack.Screen
      name="CreateChallenge"
      component={CreateChallengeScreen}
      options={{
        presentation: "modal",
        title: "Create Challenge",
      }}
    />
  </SocialStack.Navigator>
);

// Settings Stack Navigator
const SettingsNavigator = () => (
  <SettingsStack.Navigator
    screenOptions={{
      headerTitleStyle: {
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.black,
        fontSize: theme.fontSizes.large,
      },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <SettingsStack.Screen
      name="SettingsList"
      component={SettingsScreen}
      options={{ title: "Settings" }}
    />
    <SettingsStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: "My Profile" }}
    />
    <SettingsStack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ title: "Edit Profile" }}
    />
    <SettingsStack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
      options={{ title: "Notifications" }}
    />
    <SettingsStack.Screen
      name="ThemeSettings"
      component={ThemeSettingsScreen}
      options={{ title: "Appearance" }}
    />
    <SettingsStack.Screen
      name="About"
      component={AboutScreen}
      options={{ title: "About" }}
    />
  </SettingsStack.Navigator>
);

// Premium Stack Navigator
const PremiumNavigator = () => (
  <PremiumStack.Navigator
    screenOptions={{
      headerTitleStyle: {
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.black,
        fontSize: theme.fontSizes.large,
      },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <PremiumStack.Screen
      name="PremiumDashboard"
      component={PremiumDashboardScreen}
      options={{ title: "Premium" }}
    />
    <PremiumStack.Screen
      name="Subscription"
      component={SubscriptionScreen}
      options={{ title: "Subscribe" }}
    />
    <PremiumStack.Screen
      name="Store"
      component={StoreScreen}
      options={{ title: "Store" }}
    />
    <PremiumStack.Screen
      name="PremiumFeatures"
      component={PremiumFeaturesScreen}
      options={{ title: "Premium Features" }}
    />
  </PremiumStack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => {
  const subscription = useSelector((state) => state.premium.subscription);

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "HabitsTab") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "ProgressTab") {
            iconName = focused ? "bar-chart" : "bar-chart-outline";
          } else if (route.name === "SocialTab") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "SettingsTab") {
            iconName = focused ? "settings" : "settings-outline";
          } else if (route.name === "PremiumTab") {
            return getPremiumTabBarIcon(focused);
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.darkGray,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.medium,
          fontSize: 12,
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          ...theme.shadows.medium,
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen
        name="HomeTab"
        component={DashboardNavigator}
        options={{ title: "Home" }}
      />
      <MainTab.Screen
        name="HabitsTab"
        component={HabitsNavigator}
        options={{ title: "Habits" }}
      />
      <MainTab.Screen
        name="ProgressTab"
        component={ProgressNavigator}
        options={{ title: "Progress" }}
      />
      <MainTab.Screen
        name="SocialTab"
        component={SocialNavigator}
        options={{ title: "Social" }}
      />
      <MainTab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{ title: "Settings" }}
      />
      {(subscription.isSubscribed || true) && ( // Always show for easy testing
        <MainTab.Screen
          name="PremiumTab"
          component={PremiumNavigator}
          options={{ title: "Premium" }}
        />
      )}
    </MainTab.Navigator>
  );
};

// Root Navigator
const RootNavigator = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const onboardingComplete = useSelector(
    (state) => state.ui.onboardingComplete
  );

  return !isAuthenticated ? <AuthNavigator /> : <MainNavigator />;
};

export default RootNavigator;

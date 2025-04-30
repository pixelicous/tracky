import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { updateUserProfile, setUser } from "../../store/slices/authSlice";
import { db, auth } from "../../services/api/firebase";
import { Container, Card, Button, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { ProgressCircle } from "../../components/habits";
import { theme } from "../../theme";
import { fetchUserSubscription } from "../../store/slices/premiumSlice";

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.progress);
  const { achievements } = useSelector((state) => state.progress);
  const { subscription } = useSelector((state) => state.premium);

  useEffect(() => {
    console.log("Subscription:", subscription);
  }, [subscription]);

  useEffect(() => {
    dispatch(fetchUserSubscription());
  }, [dispatch]);

  // Fetch user data on focus
  // Log authentication state for debugging
  useEffect(() => {
    const logAuthState = async () => {
      try {
        console.log("Redux auth state:", user);
        console.log("Firebase auth state:", auth.currentUser);
      } catch (error) {
        console.error("Error logging auth state:", error);
      }
    };

    logAuthState();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      const fetchProfileData = async () => {
        setLoading(true);
        try {
          // Debug user object
          console.log("Current user object:", user);
          console.log("User UID:", user?.uid);

          if (!user || !user.uid) {
            console.error("User or user.uid is undefined");
            setLoading(false);
            return;
          }

          // Fetch user data from Firestore
          const userDocRef = doc(db, "users", user.uid);
          console.log("Attempting to fetch document:", userDocRef.path);

          try {
            const userDoc = await getDoc(userDocRef);
            console.log("Document exists:", userDoc.exists());

            if (userDoc.exists()) {
              const data = userDoc.data();
              console.log("Document data:", data);

              // Update user data in Redux store
              dispatch(
                setUser({
                  ...user,
                  ...data,
                  createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                  lastActive:
                    data.lastActive?.toDate?.()?.toISOString() || null,
                  updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
                })
              );
            } else {
              console.log(
                "User document doesn't exist, using Redux store data"
              );
              // Continue with the data from Redux store
            }
          } catch (docError) {
            console.error("Error getting document:", docError);
            console.error("Error code:", docError.code);
            console.error("Error message:", docError.message);
            console.log(
              "Continuing with Redux store data despite Firestore error"
            );
            // Continue with the data from Redux store despite the error
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          console.error("Error details:", JSON.stringify(error));
          Alert.alert(
            "Error",
            "Failed to load profile data. Please try again."
          );
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    }, [user, dispatch])
  );

  // Calculate level progress
  const calculateLevelProgress = () => {
    const currentLevel = stats.level || 1;
    const nextLevel = currentLevel + 1;

    // XP needed for next level
    const xpForCurrentLevel = currentLevel * currentLevel * 100;
    const xpForNextLevel = nextLevel * nextLevel * 100;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    // Current progress
    const currentXp = stats.xpPoints || 0;
    const progressXp = currentXp - xpForCurrentLevel;

    return {
      progress: Math.min(1, Math.max(0, progressXp / xpNeeded)),
      currentXp: progressXp,
      totalXpNeeded: xpNeeded,
    };
  };

  // Handle profile image selection and upload
  const handleChangeProfileImage = async () => {
    console.log("Starting profile image change process");

    // Check if user is authenticated via Redux store
    if (!user || !user.uid) {
      console.error("User is not authenticated (Redux store)");
      Alert.alert(
        "Authentication Error",
        "You need to be logged in to change your profile image."
      );
      return;
    }

    // Request permissions
    console.log("Requesting media library permissions");
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      console.log("Permission denied");
      Alert.alert(
        "Permission Denied",
        "You need to grant permission to access your photos."
      );
      return;
    }

    // Launch image picker
    console.log("Launching image picker");
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes: ImagePicker.MediaType.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (pickerResult.canceled) {
      console.log("Image picker canceled");
      return;
    }

    try {
      setIsUploading(true);
      setLoading(true);
      console.log("Image selected, preparing for upload");

      // Get image URI
      const uri = pickerResult.assets[0].uri;
      console.log("Image URI:", uri);

      // Convert URI to blob
      console.log("Converting URI to blob");
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("Blob created, size:", blob.size);

      // Create storage reference
      console.log("Creating storage reference");
      const storage = getStorage();
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      console.log("Storage reference path:", `profileImages/${user.uid}`);

      // Upload image
      console.log("Starting upload");
      const uploadTask = uploadBytesResumable(storageRef, blob);

      // Monitor upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          setUploadProgress(progress);
          console.log("Upload progress:", Math.round(progress * 100) + "%");
        },
        (error) => {
          console.error("Upload error:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          Alert.alert(
            "Upload Failed",
            "Failed to upload profile image. Please try again."
          );
          setIsUploading(false);
          setLoading(false);
        },
        async () => {
          // Upload complete, get download URL
          console.log("Upload complete, getting download URL");
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Download URL:", downloadURL);

            // Update user profile with only the photoURL
            console.log("Updating user profile with new photo URL");

            try {
              await dispatch(
                updateUserProfile({
                  photoURL: downloadURL,
                })
              ).unwrap();

              console.log("Profile updated successfully");

              // Update local user state directly in case Firestore update fails
              dispatch(
                setUser({
                  ...user,
                  photoURL: downloadURL,
                })
              );

              setIsUploading(false);
              setLoading(false);
              Alert.alert(
                "Success",
                "Your profile image has been updated successfully."
              );
            } catch (updateError) {
              console.error("Profile update error:", updateError);

              // Even if Firestore update fails, update local Redux state
              console.log("Updating local Redux state despite Firestore error");
              dispatch(
                setUser({
                  ...user,
                  photoURL: downloadURL,
                })
              );

              Alert.alert(
                "Partial Success",
                "Your profile image was uploaded but there was an issue updating your profile. The image will be available after you restart the app."
              );
              setIsUploading(false);
              setLoading(false);
            }
          } catch (urlError) {
            console.error("Error getting download URL:", urlError);
            Alert.alert(
              "Error",
              "Failed to get download URL for the uploaded image."
            );
            setIsUploading(false);
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error("Image selection error:", error);
      console.error("Error details:", JSON.stringify(error));
      Alert.alert(
        "Error",
        "There was an error selecting or uploading the image. Please try again."
      );
      setIsUploading(false);
      setLoading(false);
    }
  };

  // Handle editing profile
  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return "N/A";
    }
  };

  // Calculate level progress
  const levelInfo = calculateLevelProgress();

  // Recent achievements
  const recentAchievements = achievements.slice(0, 3);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: theme.spacing.xxl,
    },
    profileHeader: {
      alignItems: "center",
      marginBottom: theme.spacing.large,
    },
    profileImageContainer: {
      marginBottom: theme.spacing.medium,
    },
    profileImageWrapper: {
      position: "relative",
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    profilePlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: `${theme.colors.primary}20`,
      justifyContent: "center",
      alignItems: "center",
    },
    editIconContainer: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: theme.colors.white,
    },
    uploadProgress: {
      width: 120,
      height: 120,
    },
    uploadText: {
      fontSize: theme.fontSizes.small,
      fontFamily: theme.fonts.bold,
      color: theme.colors.primary,
    },
    displayName: {
      marginBottom: 0,
    },
    email: {
      marginBottom: theme.spacing.small,
    },
    subscriptionBadge: {
      backgroundColor: subscription?.isSubscribed
        ? theme.colors.secondary
        : theme.colors.primary,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.small,
      marginBottom: theme.spacing.small,
    },
    subscriptionText: {
      color: theme.colors.white,
      fontFamily: theme.fonts.medium,
    },
    editButton: {
      minWidth: 140,
    },
    levelCard: {
      marginBottom: theme.spacing.medium,
    },
    levelHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.medium,
    },
    levelLabel: {
      color: theme.colors.darkGray,
    },
    levelNumber: {
      color: theme.colors.primary,
      marginVertical: 0,
    },
    progressPercent: {
      fontSize: theme.fontSizes.small,
      fontFamily: theme.fonts.bold,
    },
    xpInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: theme.colors.lightGray,
      paddingTop: theme.spacing.medium,
    },
    totalXp: {
      color: theme.colors.darkGray,
    },
    cardTitle: {
      marginBottom: theme.spacing.medium,
    },
    statsCard: {
      marginBottom: theme.spacing.medium,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: theme.spacing.medium,
    },
    statItem: {
      width: "48%",
      backgroundColor: theme.colors.offWhite,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginBottom: theme.spacing.small,
      alignItems: "center",
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.small,
    },
    statValue: {
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.xl,
      marginBottom: 4,
    },
    statLabel: {
      textAlign: "center",
    },
    viewStatsButton: {
      alignSelf: "center",
    },
    accountCard: {
      marginBottom: theme.spacing.medium,
    },
    accountItem: {
      marginBottom: theme.spacing.small,
    },
    accountLabel: {
      marginBottom: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.medium,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    viewAllText: {
      color: theme.colors.primary,
    },
    achievementsCard: {
      marginBottom: theme.spacing.medium,
    },
    achievementItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
      paddingBottom: theme.spacing.small,
    },
    achievementIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.medium,
      justifyContent: "center",
      alignItems: "center",
      marginRight: theme.spacing.medium,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      fontFamily: theme.fonts.semiBold,
      marginBottom: 2,
    },
    achievementDate: {
      marginTop: 4,
      color: theme.colors.darkGray,
      fontSize: theme.fontSizes.xs,
    },
    achievementXp: {
      backgroundColor: `${theme.colors.primary}10`,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.small,
    },
    xpText: {
      color: theme.colors.primary,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.xs,
    },
    premiumCard: {
      backgroundColor: `${theme.colors.secondary}10`,
      marginBottom: theme.spacing.large,
    },
    premiumContent: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.medium,
    },
    premiumTextContainer: {
      marginLeft: theme.spacing.small,
      flex: 1,
    },
    premiumTitle: {
      fontFamily: theme.fonts.semiBold,
    },
    premiumButton: {
      backgroundColor: theme.colors.secondary,
      paddingVertical: theme.spacing.small,
      borderRadius: theme.borderRadius.medium,
      alignItems: "center",
    },
    premiumButtonText: {
      color: theme.colors.white,
      fontFamily: theme.fonts.semiBold,
    },
    premiumManageCard: {
      backgroundColor: `${theme.colors.secondary}10`,
      marginBottom: theme.spacing.large,
    },
    manageButton: {
      backgroundColor: theme.colors.secondary,
    },
  });

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with Image */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {isUploading ? (
              <View style={styles.uploadProgress}>
                <ProgressCircle
                  size={120}
                  strokeWidth={6}
                  progress={uploadProgress}
                  color={theme.colors.primary}
                >
                  <Body style={styles.uploadText}>
                    {Math.round(uploadProgress * 100)}%
                  </Body>
                </ProgressCircle>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.profileImageWrapper}
                onPress={handleChangeProfileImage}
                disabled={loading}
              >
                {user?.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons
                      name="person"
                      size={48}
                      color={theme.colors.primary}
                    />
                  </View>
                )}

                <View style={styles.editIconContainer}>
                  <Ionicons
                    name="camera"
                    size={20}
                    color={theme.colors.white}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <Title style={styles.displayName}>
            {user?.displayName || "User"}
          </Title>
          <Caption style={styles.email}>{user?.email || ""}</Caption>

          <View style={styles.subscriptionBadge}>
            <Caption style={styles.subscriptionText}>
              {subscription?.isSubscribed ? "Premium Member" : "Free Plan"}
            </Caption>
          </View>

          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            type="outline"
            size="small"
            icon={
              <Ionicons name="pencil" size={16} color={theme.colors.primary} />
            }
            iconPosition="left"
            style={styles.editButton}
          />
        </View>

        {/* Level and XP Card */}
        <Card style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Caption style={styles.levelLabel}>Current Level</Caption>
              <Heading style={styles.levelNumber}>{stats.level || 1}</Heading>
            </View>

            <ProgressCircle
              size={60}
              strokeWidth={8}
              progress={levelInfo.progress}
              color={theme.colors.primary}
            >
              <Body style={styles.progressPercent}>
                {Math.round(levelInfo.progress * 100)}%
              </Body>
            </ProgressCircle>
          </View>

          <View style={styles.xpInfo}>
            <Body>
              {levelInfo.currentXp} / {levelInfo.totalXpNeeded} XP to level{" "}
              {(stats.level || 1) + 1}
            </Body>
            <Body style={styles.totalXp}>Total XP: {stats.xpPoints || 0}</Body>
          </View>
        </Card>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Subheading style={styles.cardTitle}>Stats</Subheading>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${theme.colors.primary}20` },
                ]}
              >
                <Ionicons
                  name="checkmark-done"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <Body style={styles.statValue}>
                {stats.totalHabitsCompleted || 0}
              </Body>
              <Caption style={styles.statLabel}>Habits Completed</Caption>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${theme.colors.warning}20` },
                ]}
              >
                <Ionicons name="flame" size={24} color={theme.colors.warning} />
              </View>
              <Body style={styles.statValue}>{stats.currentStreak || 0}</Body>
              <Caption style={styles.statLabel}>Current Streak</Caption>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${theme.colors.tertiary}20` },
                ]}
              >
                <Ionicons
                  name="trophy"
                  size={24}
                  color={theme.colors.tertiary}
                />
              </View>
              <Body style={styles.statValue}>{stats.longestStreak || 0}</Body>
              <Caption style={styles.statLabel}>Longest Streak</Caption>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${theme.colors.secondary}20` },
                ]}
              >
                <Ionicons
                  name="star"
                  size={24}
                  color={theme.colors.secondary}
                />
              </View>
              <Body style={styles.statValue}>{achievements.length}</Body>
              <Caption style={styles.statLabel}>Achievements</Caption>
            </View>
          </View>

          <Button
            title="View Detailed Stats"
            onPress={() =>
              navigation.navigate("ProgressTab", { screen: "StatsDetail" })
            }
            type="outline"
            size="small"
            style={styles.viewStatsButton}
          />
        </Card>

        {/* Account Info Card */}
        <Card style={styles.accountCard}>
          <Subheading style={styles.cardTitle}>Account Info</Subheading>

          <View style={styles.accountItem}>
            <Caption style={styles.accountLabel}>Member Since</Caption>
            <Body>{formatDate(user?.createdAt) || "N/A"}</Body>
          </View>

          <View style={styles.accountItem}>
            <Caption style={styles.accountLabel}>Last Active</Caption>
            <Body>{formatDate(user?.lastActive) || "Today"}</Body>
          </View>

          {subscription?.isSubscribed && (
            <View style={styles.accountItem}>
              <Caption style={styles.accountLabel}>
                Subscription Expires
              </Caption>
              <Body>{formatDate(subscription?.expiryDate) || "N/A"}</Body>
            </View>
          )}
        </Card>

        {/* Recent Achievements Card */}
        {recentAchievements.length > 0 && (
          <Card style={styles.achievementsCard}>
            <View style={styles.cardHeader}>
              <Subheading style={styles.cardTitle}>
                Recent Achievements
              </Subheading>

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() =>
                  navigation.navigate("ProgressTab", { screen: "Achievements" })
                }
              >
                <Caption style={styles.viewAllText}>View All</Caption>
              </TouchableOpacity>
            </View>

            {recentAchievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: `${theme.colors.warning}20` },
                  ]}
                >
                  <Ionicons
                    name={achievement.icon || "ribbon"}
                    size={24}
                    color={theme.colors.warning}
                  />
                </View>

                <View style={styles.achievementInfo}>
                  <Body style={styles.achievementTitle}>
                    {achievement.title}
                  </Body>
                  <Caption>{achievement.description}</Caption>

                  {achievement.unlockedAt && (
                    <Caption style={styles.achievementDate}>
                      Earned on {formatDate(achievement.unlockedAt)}
                    </Caption>
                  )}
                </View>

                <View style={styles.achievementXp}>
                  <Caption style={styles.xpText}>
                    +{achievement.xpAwarded} XP
                  </Caption>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Premium Upgrade or Management */}
        {!subscription?.isSubscribed ? (
          <Card style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="diamond"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>Upgrade to Premium</Body>
                <Caption>
                  Get access to all premium features and remove ads
                </Caption>
              </View>
            </View>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() =>
                navigation.navigate("PremiumTab", { screen: "Subscription" })
              }
            >
              <Body style={styles.premiumButtonText}>Upgrade Now</Body>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card style={styles.premiumManageCard}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="diamond"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>Premium Membership</Body>
                <Caption>
                  Expires on {formatDate(subscription?.expiryDate)}
                </Caption>
              </View>
            </View>
            <Button
              title="Manage Subscription"
              onPress={() =>
                navigation.navigate("PremiumTab", {
                  screen: "PremiumDashboard",
                })
              }
              type="secondary"
              style={styles.manageButton}
            />
          </Card>
        )}
      </ScrollView>
    </Container>
  );
};

export default ProfileScreen;

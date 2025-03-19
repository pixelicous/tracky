import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { firestore } from "../../services/api/firebase";
import { sendFriendRequest } from "../../store/slices/socialSlice";
import { Container, Card, Button } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const AddFriendScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { friends, requests } = useSelector((state) => state.social);

  // Method to search users
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchPerformed(true);

    try {
      // Create a case-insensitive query
      // This is a simplified approach - in a production app you might want to
      // implement a more sophisticated search (e.g., Firestore doesn't support regex)
      const lowercaseQuery = searchQuery.toLowerCase();
      const uppercaseQuery = searchQuery.toUpperCase();
      const capitalizedQuery =
        searchQuery.charAt(0).toUpperCase() +
        searchQuery.slice(1).toLowerCase();

      // Query by email (exact match)
      const emailQuery = query(
        collection(firestore, "users"),
        where("email", "==", searchQuery.trim()),
        limit(10)
      );

      // Query by displayName (multiple cases)
      const nameQuery = query(
        collection(firestore, "users"),
        where("displayName", ">=", searchQuery.trim()),
        where("displayName", "<=", searchQuery.trim() + "\uf8ff"),
        limit(10)
      );

      // Execute queries
      const [emailResults, nameResults] = await Promise.all([
        getDocs(emailQuery),
        getDocs(nameQuery),
      ]);

      // Combine results and remove duplicates
      const combinedResults = [];

      emailResults.forEach((doc) => {
        if (doc.id !== user.uid) {
          // Don't include the current user
          combinedResults.push({
            id: doc.id,
            ...doc.data(),
          });
        }
      });

      nameResults.forEach((doc) => {
        // Check if this user is already in the results
        if (
          doc.id !== user.uid &&
          !combinedResults.some((user) => user.id === doc.id)
        ) {
          combinedResults.push({
            id: doc.id,
            ...doc.data(),
          });
        }
      });

      setSearchResults(combinedResults);
    } catch (error) {
      console.error("Error searching users:", error);
      Alert.alert("Error", "Failed to search for users. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Check if a user is already a friend
  const isFriend = (userId) => {
    return friends.some((friend) => friend.id === userId);
  };

  // Check if a friend request is pending
  const isPending = (userId) => {
    const isIncoming = requests?.incoming?.some(
      (req) => req.sender.id === userId
    );
    const isOutgoing = requests?.outgoing?.some(
      (req) => req.receiver.id === userId
    );
    return isIncoming || isOutgoing;
  };

  // Handle send friend request
  const handleSendRequest = (userId) => {
    dispatch(sendFriendRequest(userId))
      .unwrap()
      .then(() => {
        // Success alert
        Alert.alert("Success", "Friend request sent successfully!");
      })
      .catch((error) => {
        // Error alert
        Alert.alert(
          "Error",
          error || "Failed to send friend request. Please try again."
        );
      });
  };

  // Share invite link
  const shareInvite = async () => {
    try {
      await Share.share({
        message: `Join me on Daily Habits Tracker and let's motivate each other! Download the app: https://dailyhabitstracker.app/invite?ref=${user.uid}`,
        title: "Join me on Daily Habits Tracker",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share invite link. Please try again.");
    }
  };

  // Render user item
  const renderUserItem = ({ item }) => (
    <Card style={styles.userCard}>
      <View style={styles.userInfo}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={theme.colors.primary} />
          </View>
        )}

        <View style={styles.userDetails}>
          <Body style={styles.userName}>{item.displayName}</Body>
          <Caption style={styles.userEmail}>{item.email}</Caption>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {isFriend(item.id) ? (
          <View style={styles.friendBadge}>
            <Caption style={styles.friendText}>Friend</Caption>
          </View>
        ) : isPending(item.id) ? (
          <View style={styles.pendingBadge}>
            <Caption style={styles.pendingText}>Pending</Caption>
          </View>
        ) : (
          <Button
            title="Add"
            onPress={() => handleSendRequest(item.id)}
            type="outline"
            size="small"
            icon={
              <Ionicons
                name="person-add"
                size={16}
                color={theme.colors.primary}
              />
            }
            iconPosition="left"
            style={styles.addButton}
          />
        )}
      </View>
    </Card>
  );

  // Render empty search results
  const renderEmptySearch = () => (
    <View style={styles.emptyState}>
      {searchPerformed ? (
        <>
          <Ionicons name="search" size={48} color={theme.colors.gray} />
          <Body style={styles.emptyStateText}>
            No users found matching "{searchQuery}"
          </Body>
          <Caption style={styles.emptyStateHint}>
            Try a different search term or invite your friends
          </Caption>
        </>
      ) : (
        <>
          <Ionicons name="people" size={48} color={theme.colors.gray} />
          <Body style={styles.emptyStateText}>
            Search for users by email or name
          </Body>
          <Caption style={styles.emptyStateHint}>
            Or invite friends to join you
          </Caption>
        </>
      )}
    </View>
  );

  return (
    <Container>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email or name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={searchUsers}
            placeholderTextColor={theme.colors.gray}
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchUsers}
            disabled={!searchQuery.trim() || isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Ionicons name="search" size={20} color={theme.colors.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptySearch}
        />

        {/* Invite Section */}
        <Card style={styles.inviteCard}>
          <View style={styles.inviteContent}>
            <Ionicons
              name="share-social"
              size={24}
              color={theme.colors.secondary}
            />
            <View style={styles.inviteTextContainer}>
              <Body style={styles.inviteTitle}>Invite Friends</Body>
              <Caption>Share a link to invite friends to join you</Caption>
            </View>
          </View>

          <Button
            title="Share Invite Link"
            onPress={shareInvite}
            type="secondary"
            icon={
              <Ionicons
                name="share-outline"
                size={16}
                color={theme.colors.white}
              />
            }
            iconPosition="left"
            style={styles.inviteButton}
          />
        </Card>

        {/* QR Code Section - Premium Feature */}
        <Card style={styles.qrCodeCard}>
          <View style={styles.qrCodeContent}>
            <Ionicons name="qr-code" size={24} color={theme.colors.primary} />
            <View style={styles.qrCodeTextContainer}>
              <Body style={styles.qrCodeTitle}>Friend QR Code</Body>
              <Caption>
                Upgrade to premium to get a unique QR code for easy friend
                adding
              </Caption>
            </View>
          </View>

          <TouchableOpacity
            style={styles.qrCodeButton}
            onPress={() =>
              navigation.navigate("PremiumTab", { screen: "Subscription" })
            }
          >
            <Body style={styles.qrCodeButtonText}>Upgrade</Body>
          </TouchableOpacity>
        </Card>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.medium,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.black,
    marginRight: theme.spacing.small,
    ...theme.shadows.small,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.small,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.large,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.small,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.medium,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: theme.fonts.semiBold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.darkGray,
  },
  actionContainer: {
    marginLeft: theme.spacing.small,
  },
  addButton: {
    minWidth: 80,
  },
  friendBadge: {
    backgroundColor: `${theme.colors.success}20`,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  friendText: {
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  pendingBadge: {
    backgroundColor: `${theme.colors.warning}20`,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  pendingText: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.medium,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginVertical: theme.spacing.small,
  },
  emptyStateHint: {
    textAlign: "center",
    color: theme.colors.gray,
  },
  inviteCard: {
    marginBottom: theme.spacing.medium,
  },
  inviteContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  inviteTextContainer: {
    marginLeft: theme.spacing.small,
    flex: 1,
  },
  inviteTitle: {
    fontFamily: theme.fonts.semiBold,
  },
  inviteButton: {
    backgroundColor: theme.colors.secondary,
  },
  qrCodeCard: {
    backgroundColor: `${theme.colors.primary}10`,
    marginBottom: theme.spacing.large,
  },
  qrCodeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  qrCodeTextContainer: {
    marginLeft: theme.spacing.small,
    flex: 1,
  },
  qrCodeTitle: {
    fontFamily: theme.fonts.semiBold,
  },
  qrCodeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    alignItems: "center",
  },
  qrCodeButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
  },
});

export default AddFriendScreen;

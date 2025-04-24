import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchFriends,
  fetchFriendRequests,
  respondToFriendRequest,
  removeFriend,
} from "../../store/slices/socialSlice";
import { Container, Card, Button, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const FriendsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const currentTheme = useSelector((state) => state.ui.theme);
  const currentThemeColors =
    currentTheme === "dark" && theme.colors.darkMode
      ? theme.colors.darkMode
      : theme.colors;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends"); // 'friends', 'requests'

  const dispatch = useDispatch();
  const { friends, requests, loading } = useSelector((state) => state.social);

  useEffect(() => {
    loadData();

    // Set header right button
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddFriend")}
        >
          <Ionicons
            name="person-add"
            size={24}
            color={currentThemeColors.primary}
          />
        </TouchableOpacity>
      ),
    });
  }, []);

  const loadData = () => {
    dispatch(fetchFriends());
    dispatch(fetchFriendRequests());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchFriends()),
      dispatch(fetchFriendRequests()),
    ]);
    setRefreshing(false);
  };

  const handleAcceptRequest = (requestId) => {
    dispatch(respondToFriendRequest({ requestId, accept: true }));
  };

  const handleRejectRequest = (requestId) => {
    dispatch(respondToFriendRequest({ requestId, accept: false }));
  };

  const handleRemoveFriend = (friendId) => {
    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => dispatch(removeFriend(friendId)),
        },
      ]
    );
  };

  // Filter friends based on search query
  const filteredFriends =
    searchQuery.trim() === ""
      ? friends
      : friends.filter((friend) =>
          friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );

  // Get the count of pending requests
  const pendingRequestsCount =
    (requests?.incoming?.length || 0) + (requests?.outgoing?.length || 0);

  // Render friend item
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.friendItem, { backgroundColor: currentThemeColors.card }]}
      onPress={() => navigation.navigate("FriendProfile", { friend: item })}
    >
      <View style={styles.friendInfo}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person"
              size={24}
              color={currentThemeColors.primary}
            />
          </View>
        )}

        <View style={styles.friendDetails}>
          <Body style={styles.friendName}>{item.displayName}</Body>
          <Caption>
            {item.stats?.currentStreak
              ? `${item.stats.currentStreak} day streak`
              : "New Friend"}
          </Caption>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleRemoveFriend(item.id)}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={20}
          color={currentThemeColors.darkGray}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {searchQuery.trim() !== "" ? (
        <>
          <Ionicons name="search" size={48} color={currentThemeColors.gray} />
          <Body style={styles.emptyStateText}>
            No friends found matching "{searchQuery}"
          </Body>
        </>
      ) : (
        <>
          <Ionicons name="people" size={48} color={currentThemeColors.gray} />
          <Body style={styles.emptyStateText}>
            You don't have any friends yet. Add friends to share your progress
            and motivate each other.
          </Body>
          <Button
            title="Add Friends"
            onPress={() => navigation.navigate("AddFriend")}
            style={styles.emptyStateButton}
          />
        </>
      )}
    </View>
  );

  // Render incoming request item
  const renderIncomingRequest = (request) => (
    <View key={request.id} style={styles.requestItem}>
      <View style={styles.requestInfo}>
        {request.sender.photoURL ? (
          <Image
            source={{ uri: request.sender.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person"
              size={24}
              color={currentThemeColors.primary}
            />
          </View>
        )}

        <View style={styles.requestDetails}>
          <Body style={styles.requestName}>{request.sender.displayName}</Body>
          <Caption>Wants to be your friend</Caption>
        </View>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[
            styles.requestButton,
            styles.acceptButton,
            { backgroundColor: currentThemeColors.success },
          ]}
          onPress={() => handleAcceptRequest(request.id)}
        >
          <Ionicons
            name="checkmark"
            size={20}
            color={currentThemeColors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.requestButton,
            styles.rejectButton,
            { backgroundColor: currentThemeColors.error },
          ]}
          onPress={() => handleRejectRequest(request.id)}
        >
          <Ionicons name="close" size={20} color={currentThemeColors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render outgoing request item
  const renderOutgoingRequest = (request) => (
    <View key={request.id} style={styles.requestItem}>
      <View style={styles.requestInfo}>
        {request.receiver.photoURL ? (
          <Image
            source={{ uri: request.receiver.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person"
              size={24}
              color={currentThemeColors.primary}
            />
          </View>
        )}

        <View style={styles.requestDetails}>
          <Body style={styles.requestName}>{request.receiver.displayName}</Body>
          <Caption>Request sent</Caption>
        </View>
      </View>

      <View style={styles.pendingBadge}>
        <Caption style={styles.pendingText}>Pending</Caption>
      </View>
    </View>
  );

  // Loading state
  if (
    loading &&
    !refreshing &&
    friends.length === 0 &&
    (!requests || !requests.incoming || !requests.outgoing)
  ) {
    return <Loading fullScreen text="Loading friends..." />;
  }

  return (
    <Container>
      <View
        style={[
          styles.container,
          { backgroundColor: currentThemeColors.background },
        ]}
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: currentThemeColors.card },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={currentThemeColors.darkGray}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: currentThemeColors.black }]}
            placeholder="Search friends..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={currentThemeColors.gray}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={currentThemeColors.darkGray}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "friends" && styles.activeTab,
              {
                borderBottomColor:
                  activeTab === "friends"
                    ? currentThemeColors.primary
                    : currentThemeColors.lightGray,
              },
            ]}
            onPress={() => setActiveTab("friends")}
          >
            <Body
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "friends"
                      ? currentThemeColors.primary
                      : currentThemeColors.darkGray,
                },
              ]}
            >
              Friends
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "requests" && styles.activeTab,
              {
                borderBottomColor:
                  activeTab === "requests"
                    ? currentThemeColors.primary
                    : currentThemeColors.lightGray,
              },
            ]}
            onPress={() => setActiveTab("requests")}
          >
            <View style={styles.tabContent}>
              <Body
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "requests"
                        ? currentThemeColors.primary
                        : currentThemeColors.darkGray,
                  },
                ]}
              >
                Requests
              </Body>

              {pendingRequestsCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Caption style={styles.badgeText}>
                    {pendingRequestsCount}
                  </Caption>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === "friends" ? (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        ) : (
          <View style={styles.requestsContainer}>
            {/* Incoming Requests */}
            {requests?.incoming?.length > 0 && (
              <View style={styles.requestsSection}>
                <Subheading style={styles.requestsSectionTitle}>
                  Incoming Requests
                </Subheading>
                {requests.incoming.map(renderIncomingRequest)}
              </View>
            )}

            {/* Outgoing Requests */}
            {requests?.outgoing?.length > 0 && (
              <View style={styles.requestsSection}>
                <Subheading style={styles.requestsSectionTitle}>
                  Sent Requests
                </Subheading>
                {requests.outgoing.map(renderOutgoingRequest)}
              </View>
            )}

            {/* Empty state for requests */}
            {(!requests?.incoming || requests.incoming.length === 0) &&
              (!requests?.outgoing || requests.outgoing.length === 0) && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="mail"
                    size={48}
                    color={currentThemeColors.gray}
                  />
                  <Body style={styles.emptyStateText}>
                    No friend requests at the moment. Invite friends to join you
                    on your habit journey!
                  </Body>
                  <Button
                    title="Add Friends"
                    onPress={() => navigation.navigate("AddFriend")}
                    style={styles.emptyStateButton}
                  />
                </View>
              )}
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    padding: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.small,
    marginBottom: theme.spacing.medium,
    ...theme.shadows.small,
  },
  searchIcon: {
    marginRight: theme.spacing.small,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    paddingVertical: 12,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.lightGray,
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabText: {
    color: theme.colors.darkGray,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  badgeContainer: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.medium,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    ...theme.shadows.small,
  },
  friendInfo: {
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontFamily: theme.fonts.semiBold,
    marginBottom: 4,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.large,
  },
  emptyStateText: {
    textAlign: "center",
    marginVertical: theme.spacing.medium,
  },
  emptyStateButton: {
    minWidth: 150,
  },
  requestsContainer: {
    flex: 1,
  },
  requestsSection: {
    marginBottom: theme.spacing.medium,
  },
  requestsSectionTitle: {
    marginBottom: theme.spacing.small,
  },
  requestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestDetails: {
    marginLeft: theme.spacing.medium,
  },
  requestName: {
    fontFamily: theme.fonts.semiBold,
  },
  requestActions: {
    flexDirection: "row",
  },
  requestButton: {
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.small,
    marginLeft: theme.spacing.small,
  },
  acceptButton: {},
  rejectButton: {},
  pendingBadge: {
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.small,
    paddingVertical: theme.spacing.xs,
  },
  pendingText: {},
});

export default FriendsScreen;

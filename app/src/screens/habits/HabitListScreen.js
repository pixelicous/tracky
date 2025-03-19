import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { fetchHabits, completeHabit } from "../../store/slices/habitsSlice";
import { Container, Loading } from "../../components/common";
import { Body, Caption } from "../../components/common/Typography";
import { HabitCard } from "../../components/habits";
import { theme } from "../../theme";

const HabitListScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'active', 'completed'

  const dispatch = useDispatch();
  const { items: habits, loading } = useSelector((state) => state.habits);

  useEffect(() => {
    loadData();

    // Set up navigation header button
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddHabit")}
        >
          <Ionicons name="add" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, []);

  const loadData = () => {
    dispatch(fetchHabits());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchHabits());
    setRefreshing(false);
  };

  const handleHabitPress = (habit) => {
    navigation.navigate("HabitDetail", { habit });
  };

  const handleHabitToggle = (habit) => {
    dispatch(completeHabit({ id: habit.id }));
  };

  // Apply search and filters
  const filteredHabits = habits.filter((habit) => {
    // Search filter
    const matchesSearch =
      habit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (habit.description &&
        habit.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Type filter
    const today = new Date().toISOString().split("T")[0];
    const isCompletedToday =
      habit.progress?.history && habit.progress.history[today];

    if (filterType === "active" && isCompletedToday) return false;
    if (filterType === "completed" && !isCompletedToday) return false;

    return true;
  });

  // Sort habits: incomplete first, then by title
  const sortedHabits = [...filteredHabits].sort((a, b) => {
    const today = new Date().toISOString().split("T")[0];
    const aCompletedToday = a.progress?.history && a.progress.history[today];
    const bCompletedToday = b.progress?.history && b.progress.history[today];

    // First sort by completion status
    if (aCompletedToday && !bCompletedToday) return 1;
    if (!aCompletedToday && bCompletedToday) return -1;

    // Then sort alphabetically
    return a.title.localeCompare(b.title);
  });

  const renderHabitItem = ({ item }) => (
    <HabitCard
      habit={item}
      onPress={() => handleHabitPress(item)}
      onToggle={() => handleHabitToggle(item)}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {searchQuery ? (
        <>
          <Ionicons name="search" size={48} color={theme.colors.gray} />
          <Body style={styles.emptyText}>
            No habits found matching "{searchQuery}"
          </Body>
        </>
      ) : (
        <>
          <Ionicons
            name="calendar-outline"
            size={48}
            color={theme.colors.gray}
          />
          <Body style={styles.emptyText}>
            You haven't created any habits yet
          </Body>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("AddHabit")}
          >
            <Body style={styles.emptyButtonText}>Create Your First Habit</Body>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  if (loading && !refreshing && habits.length === 0) {
    return <Loading fullScreen text="Loading your habits..." />;
  }

  return (
    <Container>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.darkGray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search habits..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.gray}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.darkGray}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === "all" && styles.activeFilter,
          ]}
          onPress={() => setFilterType("all")}
        >
          <Body
            style={[
              styles.filterText,
              filterType === "all" && styles.activeFilterText,
            ]}
          >
            All
          </Body>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === "active" && styles.activeFilter,
          ]}
          onPress={() => setFilterType("active")}
        >
          <Body
            style={[
              styles.filterText,
              filterType === "active" && styles.activeFilterText,
            ]}
          >
            Active
          </Body>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === "completed" && styles.activeFilter,
          ]}
          onPress={() => setFilterType("completed")}
        >
          <Body
            style={[
              styles.filterText,
              filterType === "completed" && styles.activeFilterText,
            ]}
          >
            Completed
          </Body>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedHabits}
        renderItem={renderHabitItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
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
    color: theme.colors.black,
    paddingVertical: 12,
  },
  filtersContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
  },
  filterButton: {
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    marginRight: theme.spacing.small,
    backgroundColor: theme.colors.lightGray,
  },
  filterText: {
    color: theme.colors.darkGray,
  },
  activeFilter: {
    backgroundColor: theme.colors.primary,
  },
  activeFilterText: {
    color: theme.colors.white,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: theme.spacing.large,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
  },
  emptyButtonText: {
    color: theme.colors.white,
  },
});

export default HabitListScreen;

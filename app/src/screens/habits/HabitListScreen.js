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
import {
  fetchHabits,
  completeHabit,
  uncompleteHabit,
} from "../../store/slices/habitsSlice";
import { Container, Loading } from "../../components/common";
import { Body, Caption } from "../../components/common/Typography";
import { HabitCard } from "../../components/habits";
import { theme } from "../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HabitListScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const currentTheme = useSelector((state) => state.ui.theme);
  const currentThemeColors =
    currentTheme === "dark" ? theme.colors.darkMode : theme.colors;
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
          <Ionicons name="add" size={28} color={currentThemeColors.primary} />
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
    const today = new Date().toISOString().split("T")[0];
    const isCompletedToday =
      habit.progress?.history && habit.progress.history[today];

    if (isCompletedToday) {
      dispatch(uncompleteHabit({ id: habit.id }));
    } else {
      dispatch(completeHabit({ id: habit.id }));
    }
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
          <Ionicons name="search" size={48} color={currentThemeColors.gray} />
          <Body style={styles.emptyText}>
            No habits found matching "{searchQuery}"
          </Body>
        </>
      ) : (
        <>
          <Ionicons
            name="calendar-outline"
            size={48}
            color={currentThemeColors.gray}
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
    <View style={styles.screenContainer}>
      <Container>
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
            placeholder="Search habits..."
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

        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "all" && styles.activeFilter,
              {
                backgroundColor:
                  filterType === "all"
                    ? currentThemeColors.primary
                    : currentThemeColors.lightGray,
              },
            ]}
            onPress={() => setFilterType("all")}
          >
            <Body
              style={[
                styles.filterText,
                {
                  color:
                    filterType === "all"
                      ? currentThemeColors.white
                      : currentThemeColors.darkGray,
                },
              ]}
            >
              All
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "active" && styles.activeFilter,
              {
                backgroundColor:
                  filterType === "active"
                    ? currentThemeColors.primary
                    : currentThemeColors.lightGray,
              },
            ]}
            onPress={() => setFilterType("active")}
          >
            <Body
              style={[
                styles.filterText,
                {
                  color:
                    filterType === "active"
                      ? currentThemeColors.white
                      : currentThemeColors.darkGray,
                },
              ]}
            >
              Active
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "completed" && styles.activeFilter,
              {
                backgroundColor:
                  filterType === "completed"
                    ? currentThemeColors.primary
                    : currentThemeColors.lightGray,
              },
            ]}
            onPress={() => setFilterType("completed")}
          >
            <Body
              style={[
                styles.filterText,
                {
                  color:
                    filterType === "completed"
                      ? currentThemeColors.white
                      : currentThemeColors.darkGray,
                },
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

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + theme.spacing.medium }]}
        onPress={() => navigation.navigate("AddHabit")}
      >
        <Ionicons name="add" size={30} color={currentThemeColors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  addButton: {
    padding: 8,
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
  filtersContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
  },
  filterButton: {
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    marginRight: theme.spacing.small,
  },
  filterText: {
    fontFamily: theme.fonts.regular,
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
    marginTop: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.borderRadius.medium,
  },
  emptyButtonText: {
    fontFamily: theme.fonts.semiBold,
  },
});

export default HabitListScreen;

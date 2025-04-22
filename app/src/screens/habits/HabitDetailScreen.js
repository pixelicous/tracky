import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import {
  completeHabit,
  deleteHabit,
  fetchHabits,
} from "../../store/slices/habitsSlice";
import { Card, Container, Button, Modal } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { ProgressCircle, StreakIndicator } from "../../components/habits";
import { getIconByHabitCategory } from "../../utils/iconUtils";
import { theme } from "../../theme";

const HabitDetailScreen = ({ route, navigation }) => {
  const { habit: initialHabit } = route.params;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch();
  const { items: habits } = useSelector((state) => state.habits);

  // Get latest habit data from Redux store
  const habit = habits.find((h) => h.id === initialHabit.id) || initialHabit;

  useEffect(() => {
    // Set navigation options
    navigation.setOptions({
      title: habit.title,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons
              name="create-outline"
              size={22}
              color={theme.colors.black}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setConfirmDelete(true)}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={theme.colors.black}
            />
          </TouchableOpacity>
        </View>
      ),
    });
    console.log("HabitDetailScreen re-rendered with habit:", habit);
  }, [navigation, habit]);

  const handleEdit = () => {
    navigation.navigate("EditHabit", { habit });
  };

  const handleDelete = () => {
    dispatch(deleteHabit(habit.id))
      .unwrap()
      .then(() => {
        navigation.goBack();
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to delete habit. Please try again.");
      });
  };

  const handleComplete = () => {
    dispatch(completeHabit({ id: habit.id }));
  };

  const renderFrequencyText = () => {
    const { frequency } = habit;

    if (frequency.type === "daily") {
      return "Every day";
    } else if (frequency.type === "weekly" || frequency.type === "custom") {
      const days = frequency.days
        .map((day) => {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return dayNames[day];
        })
        .join(", ");

      return `${frequency.days.length} days a week (${days})`;
    }

    return "Custom schedule";
  };

  const renderRemindersText = () => {
    const { reminder } = habit;

    if (!reminder || !reminder.enabled) {
      return "No reminders set";
    }

    const time = reminder.time;
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    let period = "AM";
    let formattedHour = hour;

    if (hour >= 12) {
      period = "PM";
      formattedHour = hour === 12 ? 12 : hour - 12;
    }

    formattedHour = formattedHour === 0 ? 12 : formattedHour;

    if (habit.frequency.type === "daily") {
      return `Daily at ${formattedHour}:${minutes.padStart(2, "0")} ${period}`;
    } else {
      const days = reminder.days
        .map((day) => {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return dayNames[day];
        })
        .join(", ");

      return `At ${formattedHour}:${minutes.padStart(
        2,
        "0"
      )} ${period} on ${days}`;
    }
  };

  // Format date for completion status
  const formatCompletionDate = (dateStr) => {
    return format(parseISO(dateStr), "MMM d, yyyy");
  };

  // Calculate completion percentage for current month
  const calculateMonthCompletion = () => {
    if (!habit.progress || !habit.progress.history) return 0;

    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    let scheduledDays = 0;
    let completedDays = 0;

    daysInMonth.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayOfWeek = getDay(date);

      // Check if this day is scheduled based on frequency
      let isScheduled = false;
      if (habit.frequency.type === "daily") {
        isScheduled = true;
      } else if (habit.frequency.days.includes(dayOfWeek)) {
        isScheduled = true;
      }

      if (isScheduled) {
        scheduledDays++;
        if (habit.progress.history[dateStr]) {
          completedDays++;
        }
      }
    });

    return scheduledDays > 0 ? completedDays / scheduledDays : 0;
  };

  // Change month
  const changeMonth = (increment) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setSelectedMonth(newMonth);
  };

  // Render calendar heatmap
  const renderCalendarHeatmap = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    // Get starting day of week for the month (0 = Sunday, 1 = Monday, etc)
    const startDayOfWeek = getDay(start);

    // Create array for empty cells before first day of month
    const emptyCells = Array(startDayOfWeek).fill(null);

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.colors.black}
            />
          </TouchableOpacity>

          <Subheading>{format(selectedMonth, "MMMM yyyy")}</Subheading>

          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.colors.black}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayLabels}>
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <Caption key={index} style={styles.weekdayLabel}>
              {day}
            </Caption>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {/* Empty cells for days before the 1st of the month */}
          {emptyCells.map((_, index) => (
            <View key={`empty-${index}`} style={styles.calendarDay} />
          ))}

          {/* Days of the month */}
          {daysInMonth.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const dayOfWeek = getDay(date);

            // Check if this day is scheduled based on frequency
            let isScheduled = false;
            if (habit.frequency.type === "daily") {
              isScheduled = true;
            } else if (habit.frequency.days.includes(dayOfWeek)) {
              isScheduled = true;
            }

            // Check completion status
            const isCompleted =
              habit.progress?.history && habit.progress.history[dateStr];

            // Determine style based on completion
            let dayStyle = [styles.calendarDay];
            let textStyle = [styles.calendarDayText];

            if (isScheduled) {
              dayStyle.push(styles.scheduledDay);

              if (isCompleted) {
                dayStyle.push(styles.completedDay);
                textStyle.push(styles.completedDayText);
              }
            }

            return (
              <View key={dateStr} style={dayStyle}>
                <Caption style={textStyle}>{format(date, "d")}</Caption>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Calculate streak information
  const currentStreak = habit.progress?.streak || 0;
  const monthCompletionRate = calculateMonthCompletion();

  // Check if habit is completed today
  const today = new Date().toISOString().split("T")[0];
  const isCompletedToday =
    habit.progress?.history && habit.progress.history[today];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchHabits())
      .unwrap()
      .finally(() => {
        setRefreshing(false);
      });
  }, [dispatch]);

  return (
    <Container>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Habit Information Card */}
        <Card style={styles.infoCard}>
          <View style={styles.habitHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${habit.color}20` },
              ]}
            >
              {habit.icon ? (
                <Ionicons name={habit.icon} size={30} color={habit.color} />
              ) : (
                getIconByHabitCategory(habit.category, 30, habit.color)
              )}
            </View>

            <View style={styles.habitInfo}>
              <Title style={styles.habitTitle}>{habit.title}</Title>

              {habit.description && (
                <Body style={styles.habitDescription}>{habit.description}</Body>
              )}
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Caption style={styles.detailLabel}>Frequency</Caption>
              <Body>{renderFrequencyText()}</Body>
            </View>

            <View style={styles.detailItem}>
              <Caption style={styles.detailLabel}>Reminders</Caption>
              <Body>{renderRemindersText()}</Body>
            </View>

            <View style={styles.detailItem}>
              <Caption style={styles.detailLabel}>Created</Caption>
              <Body>
                {habit.createdAt
                  ? format(new Date(habit.createdAt), "MMM d, yyyy")
                  : "Unknown"}
              </Body>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={isCompletedToday ? "Completed Today" : "Mark as Complete"}
              onPress={handleComplete}
              type={isCompletedToday ? "secondary" : "primary"}
              fullWidth
              icon={
                isCompletedToday ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.white}
                  />
                ) : null
              }
            />
          </View>
        </Card>

        {/* Streak Card */}
        <Card style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Subheading>Current Streak</Subheading>

            <StreakIndicator count={currentStreak} size="large" />
          </View>

          <View style={styles.streakDetails}>
            <View style={styles.streakDetailItem}>
              <Body style={styles.streakDetailValue}>
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </Body>
              <Caption>Current Streak</Caption>
            </View>

            <View style={styles.streakDetailItem}>
              <Body style={styles.streakDetailValue}>
                {habit.progress?.lastCompleted
                  ? formatCompletionDate(habit.progress.lastCompleted)
                  : "Never"}
              </Body>
              <Caption>Last Completed</Caption>
            </View>
          </View>
        </Card>

        {/* Calendar Card */}
        <Card style={styles.calendarCard}>
          <Subheading style={styles.calendarTitle}>
            Completion History
          </Subheading>

          <View style={styles.completionRateContainer}>
            <ProgressCircle
              size={60}
              strokeWidth={8}
              progress={monthCompletionRate}
              color={theme.colors.primary}
            >
              <Body style={styles.completionRateText}>
                {Math.round(monthCompletionRate * 100)}%
              </Body>
            </ProgressCircle>

            <View style={styles.completionRateInfo}>
              <Body>Monthly Completion Rate</Body>
              <Caption>For {format(selectedMonth, "MMMM yyyy")}</Caption>
            </View>
          </View>

          {renderCalendarHeatmap()}
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={confirmDelete}
          title="Delete Habit"
          onClose={() => setConfirmDelete(false)}
        >
          <Body style={styles.deleteModalText}>
            Are you sure you want to delete this habit? This action cannot be
            undone.
          </Body>

          <View style={styles.deleteModalButtons}>
            <Button
              title="Cancel"
              onPress={() => setConfirmDelete(false)}
              type="outline"
              style={styles.deleteModalButton}
            />

            <Button
              title="Delete"
              onPress={handleDelete}
              type="secondary"
              style={styles.deleteModalButton}
            />
          </View>
        </Modal>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  infoCard: {
    marginBottom: theme.spacing.medium,
  },
  habitHeader: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    marginVertical: 0,
  },
  habitDescription: {
    color: theme.colors.darkGray,
    marginTop: 4,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  detailItem: {
    marginBottom: theme.spacing.small,
  },
  detailLabel: {
    marginBottom: 2,
  },
  buttonContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: theme.spacing.medium,
  },
  streakCard: {
    marginBottom: theme.spacing.medium,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  streakDetails: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: theme.spacing.medium,
  },
  streakDetailItem: {
    flex: 1,
    alignItems: "center",
  },
  streakDetailValue: {
    fontFamily: theme.fonts.semiBold,
    marginBottom: 4,
  },
  calendarCard: {
    marginBottom: theme.spacing.large,
  },
  calendarTitle: {
    marginBottom: theme.spacing.medium,
  },
  completionRateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  completionRateInfo: {
    marginLeft: theme.spacing.medium,
  },
  completionRateText: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fonts.bold,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  calendarContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.small,
  },
  weekdayLabels: {
    flexDirection: "row",
    marginBottom: theme.spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: theme.fonts.medium,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  calendarDayText: {
    fontSize: theme.fontSizes.small,
  },
  scheduledDay: {
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.small,
  },
  completedDay: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  completedDayText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  deleteModalText: {
    textAlign: "center",
    marginBottom: theme.spacing.large,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deleteModalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});

export default HabitDetailScreen;

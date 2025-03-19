import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { format, subDays, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { fetchStatsHistory } from "../../store/slices/progressSlice";
import { Card, Container, Loading } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const { width } = Dimensions.get("window");
const chartWidth = width - 40;

const StatsDetailScreen = ({ navigation, route }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [selectedChartType, setSelectedChartType] = useState("completion");

  const dispatch = useDispatch();
  const { statsHistory, loading } = useSelector((state) => state.progress);
  const { items: habits } = useSelector((state) => state.habits);
  const { subscription } = useSelector((state) => state.premium);

  useEffect(() => {
    // Load stats for the selected timeframe
    dispatch(fetchStatsHistory(selectedTimeframe));
  }, [selectedTimeframe]);

  // Prepare data for the chart based on timeframe and chart type
  const prepareChartData = () => {
    if (
      !statsHistory ||
      !statsHistory.stats ||
      statsHistory.stats.length === 0
    ) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
      };
    }

    // Format labels based on timeframe
    let labels = [];
    let completionData = [];

    switch (selectedTimeframe) {
      case "week":
        labels = statsHistory.stats.map((day) =>
          format(new Date(day.date), "EEE")
        );
        completionData = statsHistory.stats.map((day) =>
          Math.round(day.completionRate || 0)
        );
        break;
      case "month":
        // Group by week for monthly view
        const groupedByWeek = [];
        for (let i = 0; i < statsHistory.stats.length; i += 7) {
          const weekData = statsHistory.stats.slice(i, i + 7);
          if (weekData.length > 0) {
            const weekAvg =
              weekData.reduce(
                (sum, day) => sum + (day.completionRate || 0),
                0
              ) / weekData.length;
            const weekStart = format(new Date(weekData[0].date), "MMM d");
            groupedByWeek.push({
              label: weekStart,
              value: Math.round(weekAvg),
            });
          }
        }

        labels = groupedByWeek.map((week) => week.label);
        completionData = groupedByWeek.map((week) => week.value);
        break;
      case "year":
        // Group by month for yearly view
        const months = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - 11 + i);
          return format(date, "MMM");
        });

        // Initialize data for all months
        const monthlyData = months.map((month) => ({
          label: month,
          value: 0,
          count: 0,
        }));

        // Populate with actual data
        statsHistory.stats.forEach((day) => {
          const monthLabel = format(new Date(day.date), "MMM");
          const monthIndex = monthlyData.findIndex(
            (m) => m.label === monthLabel
          );

          if (monthIndex !== -1) {
            monthlyData[monthIndex].value += day.completionRate || 0;
            monthlyData[monthIndex].count += 1;
          }
        });

        // Calculate averages for each month
        monthlyData.forEach((month) => {
          if (month.count > 0) {
            month.value = Math.round(month.value / month.count);
          }
        });

        labels = monthlyData.map((month) => month.label);
        completionData = monthlyData.map((month) => month.value);
        break;
    }

    // Return data based on selected chart type
    if (selectedChartType === "completion") {
      return {
        labels,
        datasets: [{ data: completionData }],
      };
    } else if (selectedChartType === "habits") {
      // Count habit completions by category
      const categoryCompletions = {};

      habits.forEach((habit) => {
        const category = habit.category || "other";
        if (!categoryCompletions[category]) {
          categoryCompletions[category] = {
            name: category,
            count: 0,
            color: habit.color || theme.colors.primary,
          };
        }

        // Count completions from history
        if (habit.progress && habit.progress.history) {
          Object.values(habit.progress.history).forEach((count) => {
            categoryCompletions[category].count += count;
          });
        }
      });

      // Format for pie chart
      const pieData = Object.values(categoryCompletions)
        .filter((cat) => cat.count > 0)
        .map((cat) => ({
          name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
          count: cat.count,
          color: cat.color,
          legendFontColor: theme.colors.black,
          legendFontSize: 12,
        }));

      return pieData.length > 0
        ? pieData
        : [
            {
              name: "No Data",
              count: 1,
              color: theme.colors.lightGray,
              legendFontColor: theme.colors.black,
              legendFontSize: 12,
            },
          ];
    }

    return {
      labels,
      datasets: [{ data: completionData }],
    };
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    if (
      !statsHistory ||
      !statsHistory.stats ||
      statsHistory.stats.length === 0
    ) {
      return {
        averageCompletion: 0,
        bestDay: { date: "-", rate: 0 },
        worstDay: { date: "-", rate: 0 },
        totalCompleted: 0,
      };
    }

    const stats = statsHistory.stats;
    const totalCompletions = stats.reduce(
      (sum, day) => sum + (day.completed || 0),
      0
    );

    // Calculate average completion rate
    const avgCompletion =
      stats.reduce((sum, day) => sum + (day.completionRate || 0), 0) /
      stats.length;

    // Find best and worst days
    let bestDay = { date: "-", rate: 0 };
    let worstDay = { date: "-", rate: 100 };

    stats.forEach((day) => {
      if (day.completionRate > bestDay.rate) {
        bestDay = {
          date: format(new Date(day.date), "MMM d"),
          rate: day.completionRate,
        };
      }

      if (day.completionRate < worstDay.rate && day.total > 0) {
        worstDay = {
          date: format(new Date(day.date), "MMM d"),
          rate: day.completionRate,
        };
      }
    });

    return {
      averageCompletion: Math.round(avgCompletion),
      bestDay,
      worstDay,
      totalCompleted: totalCompletions,
    };
  };

  const chartData = prepareChartData();
  const metrics = calculateSummaryMetrics();

  if (loading && !chartData) {
    return <Loading fullScreen text="Loading your stats..." />;
  }

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedTimeframe === "week" && styles.selectedButton,
            ]}
            onPress={() => setSelectedTimeframe("week")}
          >
            <Body
              style={[
                styles.selectorText,
                selectedTimeframe === "week" && styles.selectedText,
              ]}
            >
              Week
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedTimeframe === "month" && styles.selectedButton,
            ]}
            onPress={() => setSelectedTimeframe("month")}
          >
            <Body
              style={[
                styles.selectorText,
                selectedTimeframe === "month" && styles.selectedText,
              ]}
            >
              Month
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedTimeframe === "year" && styles.selectedButton,
            ]}
            onPress={() => setSelectedTimeframe("year")}
            disabled={!subscription.isSubscribed}
          >
            <Body
              style={[
                styles.selectorText,
                selectedTimeframe === "year" && styles.selectedText,
                !subscription.isSubscribed && styles.disabledText,
              ]}
            >
              Year {!subscription.isSubscribed && "🔒"}
            </Body>
          </TouchableOpacity>
        </View>

        {/* Chart Type Selector */}
        <View style={styles.chartTypeContainer}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChartType === "completion" && styles.selectedChartType,
            ]}
            onPress={() => setSelectedChartType("completion")}
          >
            <Body
              style={[
                styles.chartTypeText,
                selectedChartType === "completion" &&
                  styles.selectedChartTypeText,
              ]}
            >
              Completion Rate
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChartType === "habits" && styles.selectedChartType,
            ]}
            onPress={() => setSelectedChartType("habits")}
          >
            <Body
              style={[
                styles.chartTypeText,
                selectedChartType === "habits" && styles.selectedChartTypeText,
              ]}
            >
              Habits by Category
            </Body>
          </TouchableOpacity>
        </View>

        {/* Chart Card */}
        <Card style={styles.chartCard}>
          <Subheading style={styles.cardTitle}>
            {selectedChartType === "completion"
              ? `Completion Rate (${
                  selectedTimeframe.charAt(0).toUpperCase() +
                  selectedTimeframe.slice(1)
                })`
              : "Habits by Category"}
          </Subheading>

          <View style={styles.chartContainer}>
            {selectedChartType === "completion" ? (
              <BarChart
                data={chartData}
                width={chartWidth}
                height={220}
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: theme.colors.white,
                  backgroundGradientFrom: theme.colors.white,
                  backgroundGradientTo: theme.colors.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(106, 90, 224, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(113, 117, 133, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.7,
                  propsForLabels: {
                    fontSize: 12,
                    fontFamily: theme.fonts.medium,
                  },
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            ) : (
              <PieChart
                data={chartData}
                width={chartWidth}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.white,
                  backgroundGradientFrom: theme.colors.white,
                  backgroundGradientTo: theme.colors.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(106, 90, 224, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(113, 117, 133, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForLabels: {
                    fontSize: 12,
                    fontFamily: theme.fonts.medium,
                  },
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                absolute
              />
            )}
          </View>
        </Card>

        {/* Summary Metrics Card */}
        <Card style={styles.metricsCard}>
          <Subheading style={styles.cardTitle}>Summary</Subheading>

          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: `${theme.colors.primary}20` },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <Heading style={styles.metricValue}>
                {metrics.averageCompletion}%
              </Heading>
              <Caption style={styles.metricLabel}>Average Completion</Caption>
            </View>

            <View style={styles.metricItem}>
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: `${theme.colors.success}20` },
                ]}
              >
                <Ionicons
                  name="trophy"
                  size={24}
                  color={theme.colors.success}
                />
              </View>
              <Heading style={styles.metricValue}>
                {metrics.bestDay.rate}%
              </Heading>
              <Caption style={styles.metricLabel}>
                Best Day: {metrics.bestDay.date}
              </Caption>
            </View>

            <View style={styles.metricItem}>
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: `${theme.colors.error}20` },
                ]}
              >
                <Ionicons
                  name="trending-down"
                  size={24}
                  color={theme.colors.error}
                />
              </View>
              <Heading style={styles.metricValue}>
                {metrics.worstDay.rate}%
              </Heading>
              <Caption style={styles.metricLabel}>
                Lowest Day: {metrics.worstDay.date}
              </Caption>
            </View>

            <View style={styles.metricItem}>
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: `${theme.colors.tertiary}20` },
                ]}
              >
                <Ionicons
                  name="checkbox"
                  size={24}
                  color={theme.colors.tertiary}
                />
              </View>
              <Heading style={styles.metricValue}>
                {metrics.totalCompleted}
              </Heading>
              <Caption style={styles.metricLabel}>Total Completions</Caption>
            </View>
          </View>
        </Card>

        {/* Insights Card - Premium feature */}
        {subscription.isSubscribed ? (
          <Card style={styles.insightsCard}>
            <Subheading style={styles.cardTitle}>AI Insights</Subheading>

            <View style={styles.insightContainer}>
              <Ionicons
                name="bulb"
                size={24}
                color={theme.colors.warning}
                style={styles.insightIcon}
              />
              <Body style={styles.insightText}>
                Your completion rate is highest on Mondays and lowest on
                Weekends. Consider scheduling important habits early in the
                week.
              </Body>
            </View>

            <View style={styles.insightContainer}>
              <Ionicons
                name="analytics"
                size={24}
                color={theme.colors.primary}
                style={styles.insightIcon}
              />
              <Body style={styles.insightText}>
                Morning habits have a 78% completion rate, compared to 45% for
                evening habits. Try moving critical habits to morning time
                slots.
              </Body>
            </View>

            <View style={styles.insightContainer}>
              <Ionicons
                name="flash"
                size={24}
                color={theme.colors.secondary}
                style={styles.insightIcon}
              />
              <Body style={styles.insightText}>
                You're most consistent with Health and Productivity categories.
                Consider building on this strength with related habits.
              </Body>
            </View>
          </Card>
        ) : (
          <Card style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <Ionicons
                name="analytics"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.premiumTextContainer}>
                <Body style={styles.premiumTitle}>Unlock AI Insights</Body>
                <Caption>
                  Get personalized recommendations and advanced analytics!
                </Caption>
              </View>
            </View>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() =>
                navigation.navigate("PremiumTab", { screen: "Subscription" })
              }
            >
              <Body style={styles.premiumButtonText}>Upgrade</Body>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxl,
  },
  selectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.medium,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.small,
    marginHorizontal: 4,
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: theme.colors.primary,
  },
  selectorText: {
    color: theme.colors.darkGray,
  },
  selectedText: {
    color: theme.colors.white,
  },
  disabledText: {
    color: theme.colors.gray,
  },
  chartTypeContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.small,
    marginHorizontal: 4,
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    alignItems: "center",
  },
  selectedChartType: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  chartTypeText: {
    color: theme.colors.darkGray,
  },
  selectedChartTypeText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  chartCard: {
    marginBottom: theme.spacing.medium,
    padding: theme.spacing.medium,
  },
  cardTitle: {
    marginBottom: theme.spacing.medium,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: theme.borderRadius.medium,
  },
  metricsCard: {
    marginBottom: theme.spacing.medium,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
    alignItems: "center",
    ...theme.shadows.small,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  metricValue: {
    marginVertical: 4,
    fontSize: theme.fontSizes.xl,
  },
  metricLabel: {
    textAlign: "center",
  },
  insightsCard: {
    marginBottom: theme.spacing.medium,
  },
  insightContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.medium,
    paddingBottom: theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  insightIcon: {
    marginRight: theme.spacing.medium,
  },
  insightText: {
    flex: 1,
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
});

export default StatsDetailScreen;

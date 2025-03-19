import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import {
  initializeRevenueCat,
  fetchSubscriptionOfferings,
  purchaseSubscription,
  restorePurchases,
} from "../../store/slices/premiumSlice";
import { Container, Card, Button } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const SubscriptionScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);

  const dispatch = useDispatch();
  const { offerings, loading, error, subscription } = useSelector(
    (state) => state.premium
  );

  useEffect(() => {
    // Initialize RevenueCat and fetch subscription offerings
    const initSubscriptions = async () => {
      await dispatch(initializeRevenueCat());
      dispatch(fetchSubscriptionOfferings());
    };

    initSubscriptions();
  }, []);

  // Check if user is already subscribed
  useEffect(() => {
    if (subscription.isSubscribed) {
      navigation.navigate("PremiumDashboard");
    }
  }, [subscription.isSubscribed]);

  const handlePurchase = async () => {
    if (!selectedPlan) {
      Alert.alert(
        "Select a Plan",
        "Please select a subscription plan to continue."
      );
      return;
    }

    try {
      setProcessingPurchase(true);
      await dispatch(purchaseSubscription(selectedPlan)).unwrap();
      setProcessingPurchase(false);

      // Show success message and navigate to premium dashboard
      Alert.alert(
        "Subscription Successful",
        "Thank you for subscribing to Premium! Enjoy all the features.",
        [{ text: "OK", onPress: () => navigation.navigate("PremiumDashboard") }]
      );
    } catch (error) {
      setProcessingPurchase(false);

      if (error !== "Purchase cancelled") {
        Alert.alert(
          "Subscription Failed",
          "There was an error processing your subscription. Please try again."
        );
      }
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setProcessingPurchase(true);
      const result = await dispatch(restorePurchases()).unwrap();
      setProcessingPurchase(false);

      if (result.isSubscribed) {
        Alert.alert(
          "Purchases Restored",
          "Your subscription has been successfully restored.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("PremiumDashboard"),
            },
          ]
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases linked to your account."
        );
      }
    } catch (error) {
      setProcessingPurchase(false);
      Alert.alert(
        "Restore Failed",
        "There was an error restoring your purchases. Please try again."
      );
    }
  };

  // Get available subscription packages
  const getSubscriptionPackages = () => {
    if (
      !offerings ||
      !offerings.current ||
      !offerings.current.availablePackages
    ) {
      return [];
    }

    return offerings.current.availablePackages.filter((pkg) =>
      ["monthly", "annual", "lifetime"].includes(pkg.identifier)
    );
  };

  const packages = getSubscriptionPackages();

  const renderFeatureItem = (text, isPremium = true) => (
    <View style={styles.featureItem}>
      <Ionicons
        name={isPremium ? "checkmark-circle" : "close-circle"}
        size={20}
        color={isPremium ? theme.colors.success : theme.colors.gray}
      />
      <Body style={[styles.featureText, !isPremium && styles.featureDisabled]}>
        {text}
      </Body>
    </View>
  );

  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Upgrade to Premium</Title>
          <Body style={styles.subtitle}>
            Unlock all premium features and take your habit tracking to the next
            level
          </Body>
        </View>

        {/* Plan Selection */}
        <View style={styles.plansContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Body style={styles.loadingText}>
                Loading subscription options...
              </Body>
            </View>
          ) : (
            <>
              {packages.length === 0 ? (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle"
                    size={40}
                    color={theme.colors.error}
                  />
                  <Body style={styles.errorText}>
                    Unable to load subscription options. Please try again later.
                  </Body>
                  <Button
                    title="Retry"
                    onPress={() => dispatch(fetchSubscriptionOfferings())}
                    type="outline"
                    style={styles.retryButton}
                  />
                </View>
              ) : (
                <>
                  {packages.map((pkg) => {
                    const isMonthly = pkg.identifier === "monthly";
                    const isAnnual = pkg.identifier === "annual";
                    const isLifetime = pkg.identifier === "lifetime";

                    // Format price and savings text
                    const price = pkg.product.priceString;
                    let durationText = "";
                    let savingsText = "";

                    if (isMonthly) {
                      durationText = "Monthly";
                    } else if (isAnnual) {
                      durationText = "Yearly";

                      // Calculate savings compared to monthly
                      const monthlyPkg = packages.find(
                        (p) => p.identifier === "monthly"
                      );
                      if (monthlyPkg) {
                        const monthlyPrice = monthlyPkg.product.price;
                        const annualPrice = pkg.product.price;
                        const monthlyCostOfAnnual = annualPrice / 12;
                        const savingsPercent = Math.round(
                          (1 - monthlyCostOfAnnual / monthlyPrice) * 100
                        );
                        if (savingsPercent > 0) {
                          savingsText = `Save ${savingsPercent}%`;
                        }
                      }
                    } else if (isLifetime) {
                      durationText = "Lifetime";
                      savingsText = "Best Value";
                    }

                    return (
                      <TouchableOpacity
                        key={pkg.identifier}
                        style={[
                          styles.planCard,
                          selectedPlan?.identifier === pkg.identifier &&
                            styles.selectedPlan,
                          isAnnual && styles.featuredPlan,
                        ]}
                        onPress={() => setSelectedPlan(pkg)}
                      >
                        <View style={styles.planHeader}>
                          <Body
                            style={[
                              styles.planTitle,
                              selectedPlan?.identifier === pkg.identifier &&
                                styles.selectedPlanText,
                            ]}
                          >
                            {durationText}
                          </Body>

                          {savingsText ? (
                            <View
                              style={[
                                styles.savingsBadge,
                                isLifetime && styles.lifetimeBadge,
                              ]}
                            >
                              <Caption style={styles.savingsText}>
                                {savingsText}
                              </Caption>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.priceContainer}>
                          <Heading
                            style={[
                              styles.priceText,
                              selectedPlan?.identifier === pkg.identifier &&
                                styles.selectedPlanText,
                            ]}
                          >
                            {price}
                          </Heading>

                          <Caption
                            style={[
                              styles.durationText,
                              selectedPlan?.identifier === pkg.identifier &&
                                styles.selectedPlanSubtext,
                            ]}
                          >
                            {isMonthly
                              ? "per month"
                              : isAnnual
                              ? "per year"
                              : "one-time payment"}
                          </Caption>
                        </View>

                        <View style={styles.checkContainer}>
                          {selectedPlan?.identifier === pkg.identifier && (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color={theme.colors.white}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>

        {/* Feature Comparison */}
        <Card style={styles.featuresCard}>
          <Subheading style={styles.featuresTitle}>Premium Features</Subheading>

          <View style={styles.featuresContainer}>
            {renderFeatureItem("Advanced Habit Analytics")}
            {renderFeatureItem("AI-Powered Habit Suggestions")}
            {renderFeatureItem("Premium Themes & Custom Avatars")}
            {renderFeatureItem("Gamified Quests & Challenges")}
            {renderFeatureItem("Social Leaderboards")}
            {renderFeatureItem("Smart Reminders")}
            {renderFeatureItem("Cloud Backup & Cross-Device Sync")}
            {renderFeatureItem("Ad-Free Experience")}
          </View>

          <Subheading style={styles.featuresTitle}>Free Features</Subheading>

          <View style={styles.featuresContainer}>
            {renderFeatureItem("Custom Habit Creation", false)}
            {renderFeatureItem("Daily Streak & Progress Tracking", false)}
            {renderFeatureItem("Basic Reminders", false)}
            {renderFeatureItem("Minimal Gamification", false)}
            {renderFeatureItem("Basic Analytics", false)}
          </View>
        </Card>

        {/* Purchase Button */}
        <View style={styles.purchaseContainer}>
          <Button
            title={processingPurchase ? "Processing..." : "Subscribe Now"}
            onPress={handlePurchase}
            loading={processingPurchase}
            disabled={
              processingPurchase || packages.length === 0 || !selectedPlan
            }
            fullWidth
            size="large"
          />

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={processingPurchase}
          >
            <Body style={styles.restoreText}>Restore Purchases</Body>
          </TouchableOpacity>
        </View>

        {/* Terms and Privacy */}
        <View style={styles.termsContainer}>
          <Caption style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy
            Policy. Subscriptions automatically renew unless auto-renew is
            turned off at least 24 hours before the end of the current period.
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
  contentContainer: {
    paddingBottom: theme.spacing.xxl,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.large,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    color: theme.colors.darkGray,
  },
  plansContainer: {
    marginBottom: theme.spacing.large,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.large,
  },
  loadingText: {
    marginTop: theme.spacing.medium,
    color: theme.colors.darkGray,
  },
  errorContainer: {
    alignItems: "center",
    padding: theme.spacing.large,
  },
  errorText: {
    textAlign: "center",
    color: theme.colors.darkGray,
    marginVertical: theme.spacing.medium,
  },
  retryButton: {
    marginTop: theme.spacing.small,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    ...theme.shadows.small,
  },
  selectedPlan: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  featuredPlan: {
    borderColor: theme.colors.secondary,
    borderWidth: 2,
  },
  planHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  planTitle: {
    fontFamily: theme.fonts.semiBold,
  },
  selectedPlanText: {
    color: theme.colors.white,
  },
  selectedPlanSubtext: {
    color: `${theme.colors.white}99`,
  },
  savingsBadge: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  lifetimeBadge: {
    backgroundColor: theme.colors.tertiary,
  },
  savingsText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.medium,
  },
  priceContainer: {
    flex: 1,
    alignItems: "center",
  },
  priceText: {
    marginBottom: 2,
  },
  durationText: {
    color: theme.colors.darkGray,
  },
  checkContainer: {
    width: 24,
    marginLeft: theme.spacing.small,
  },
  featuresCard: {
    marginBottom: theme.spacing.large,
  },
  featuresTitle: {
    marginBottom: theme.spacing.small,
  },
  featuresContainer: {
    marginBottom: theme.spacing.medium,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  featureText: {
    marginLeft: theme.spacing.small,
  },
  featureDisabled: {
    color: theme.colors.darkGray,
  },
  purchaseContainer: {
    marginBottom: theme.spacing.large,
  },
  restoreButton: {
    alignItems: "center",
    marginTop: theme.spacing.medium,
  },
  restoreText: {
    color: theme.colors.primary,
  },
  termsContainer: {
    alignItems: "center",
  },
  termsText: {
    textAlign: "center",
    color: theme.colors.gray,
    fontSize: theme.fontSizes.xs,
  },
});

export default SubscriptionScreen;

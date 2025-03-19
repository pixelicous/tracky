import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Container } from "../../components/common";

const PremiumFeaturesScreen = () => {
  return (
    <Container>
      <Text style={styles.title}>Premium Features</Text>
      <View style={styles.featuresList}>
        <Text style={styles.featureItem}>Advanced Habit Analytics</Text>
        <Text style={styles.featureItem}>AI-Powered Habit Suggestions</Text>
        <Text style={styles.featureItem}>
          Premium Themes &amp; Custom Avatars
        </Text>
        <Text style={styles.featureItem}>Gamified Quests &amp; Challenges</Text>
        <Text style={styles.featureItem}>
          Social Leaderboards &amp; Group Challenges
        </Text>
        <Text style={styles.featureItem}>Smart Reminders</Text>
        <Text style={styles.featureItem}>
          Cloud Backup &amp; Cross-Device Sync
        </Text>
        <Text style={styles.featureItem}>No Ads</Text>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  featuresList: {
    paddingHorizontal: 20,
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default PremiumFeaturesScreen;

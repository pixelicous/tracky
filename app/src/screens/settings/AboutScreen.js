import React from "react";
import { View, StyleSheet, ScrollView, Linking } from "react-native";
import { Container, Card } from "../../components/common";
import {
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
} from "../../components/common/Typography";
import { theme } from "../../theme";

const AboutScreen = () => {
  return (
    <Container>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* About App Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>About Daily Habits</Subheading>
          <Body style={styles.aboutText}>
            Daily Habits is your personal companion for building and maintaining
            positive habits. We believe that small, consistent actions can lead
            to significant improvements in your life.
          </Body>
        </Card>

        {/* Contact Us Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Contact Us</Subheading>
          <Body style={styles.contactText}>
            Have questions or feedback? Reach out to us!
          </Body>
          <Body
            style={styles.link}
            onPress={() => Linking.openURL("mailto:support@dailyhabits.com")}
          >
            support@dailyhabits.com
          </Body>
        </Card>

        {/* Version Info Card */}
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Version</Subheading>
          <Caption style={styles.versionText}>Version 1.0.0</Caption>
        </Card>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  contactText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  versionText: {
    textAlign: "center",
    color: theme.colors.gray,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.primary,
    textAlign: "center",
  },
});

export default AboutScreen;

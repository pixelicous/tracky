import React from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { theme } from "../../theme";

const Container = ({
  children,
  style,
  scrollable = false,
  withScrollView = false,
  keyboardAvoiding = false,
  ...props
}) => {
  const ContainerComponent = scrollable || withScrollView ? ScrollView : View;

  const content = (
    <ContainerComponent
      style={[styles.container, style]}
      contentContainerStyle={scrollable && styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ContainerComponent>
  );

  if (keyboardAvoiding) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.white}
        />
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 20}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.medium,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  keyboardAvoiding: {
    flex: 1,
  },
});

export default Container;

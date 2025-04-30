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
import { useSelector } from "react-redux";
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

  const currentTheme = useSelector((state) => state.ui.theme);
  const currentThemeColors =
    currentTheme === "dark" ? theme.colors.darkMode : theme.colors;

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
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: currentThemeColors.background },
        ]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.white}
        />
        <KeyboardAvoidingView
          style={[
            styles.keyboardAvoiding,
            {
              backgroundColor:
                currentTheme === "dark"
                  ? currentThemeColors.background
                  : theme.colors.background,
            },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 20}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            currentTheme === "dark"
              ? currentThemeColors.background
              : theme.colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle={currentTheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={
          currentTheme === "dark"
            ? currentThemeColors.background
            : theme.colors.white
        }
      />
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
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

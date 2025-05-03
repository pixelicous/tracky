import React from "react";
import {
  View,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { signOut } from "../../store/slices/authSlice";
import { Title, Body, Button } from "./index";
import { theme } from "../../theme";

/**
 * Modal component to display authentication errors and guide users to sign out and sign back in
 */
const AuthErrorModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();

  const handleSignOut = () => {
    dispatch(signOut())
      .unwrap()
      .then(() => {
        if (onClose) onClose();
      });
  };

  const handleRetry = async () => {
    try {
      // Try to restore authentication
      const { ensureFreshAuthToken } = require("../../utils/authUtils");
      const isAuthenticated = await ensureFreshAuthToken();

      if (isAuthenticated) {
        console.log("Authentication restored successfully");
        if (onClose) onClose();
      } else {
        console.log("Failed to restore authentication");
        // Keep modal open
      }
    } catch (error) {
      console.error("Error retrying authentication:", error);
    }
  };

  return (
    <RNModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Title style={styles.title}>Authentication Error</Title>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.black} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.iconContainer}>
            <Ionicons
              name="alert-circle"
              size={60}
              color={theme.colors.warning}
            />
          </View>

          <Body style={styles.message}>
            Your session has expired or is invalid. This can happen when using
            Google Sign-In and restarting the app.
          </Body>

          <Body style={styles.submessage}>
            You can try to restore your session or sign out and sign back in.
          </Body>

          <View style={styles.buttonContainer}>
            <Button
              title="Try Again"
              onPress={handleRetry}
              type="secondary"
              style={styles.retryButton}
              fullWidth
            />

            <Button
              title="Sign Out"
              onPress={handleSignOut}
              type="primary"
              fullWidth
            />
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.large,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: theme.spacing.medium,
  },
  message: {
    textAlign: "center",
    marginBottom: theme.spacing.medium,
  },
  submessage: {
    textAlign: "center",
    marginBottom: theme.spacing.large,
    color: theme.colors.darkGray,
    fontSize: theme.fontSizes.small,
  },
  buttonContainer: {
    marginTop: theme.spacing.medium,
  },
  retryButton: {
    marginBottom: theme.spacing.medium,
  },
});

export default AuthErrorModal;

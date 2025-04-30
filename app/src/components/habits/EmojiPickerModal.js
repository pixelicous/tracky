import React from "react";
import {
  View,
  StyleSheet,
  Button,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import EmojiSelector from "react-native-emoji-selector";
import { theme } from "../../theme";

const EmojiPickerModal = ({ visible, onSelectEmoji, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.emojiSelectorContainer}>
            <EmojiSelector
              onEmojiSelected={(emoji) => {
                // Pass the selected emoji to the parent component
                onSelectEmoji(emoji);
                onClose();
              }}
              showSearchBar={true}
              showTabs={true}
              showHistory={false}
              columns={8}
              categoryFontSize={16}
              categoryIconSize={20}
              style={{
                backgroundColor: "white",
                height: "100%",
              }}
              searchStyle={{
                backgroundColor: "#f0f0f0",
                borderRadius: 10,
                padding: 8,
                marginHorizontal: 10,
                marginVertical: 8,
                borderWidth: 0, // Remove the line that stretches on text
              }}
            />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Button
                title="Close"
                onPress={onClose}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    width: "90%",
    height: "70%",
    overflow: "hidden",
  },
  emojiSelectorContainer: {
    flex: 1,
    width: "100%",
    height: "85%", // Limit height to ensure space for button
    marginBottom: 15, // Add more space between emoji selector and button
  },
  buttonContainer: {
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "white", // Ensure button has solid background
    position: "absolute", // Position at bottom
    bottom: 10,
    left: 0,
    right: 0,
  },
  closeButton: {
    alignSelf: "center",
    width: "50%", // Limit button width
  },
});

export default EmojiPickerModal;

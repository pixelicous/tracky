import React from "react";
import { View, StyleSheet, Button, TouchableOpacity } from "react-native";
import EmojiSelector from "react-native-emoji-selector";

const EmojiPickerModal = ({ visible, onSelect, onClose }) => {
  return (
    visible && (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <EmojiSelector onEmojiSelected={onSelect} />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Button title="Close" onPress={onClose} />
          </TouchableOpacity>
        </View>
      </View>
    )
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
    padding: 20,
    width: "80%",
    maxHeight: "80%",
    alignItems: "center",
  },
  closeButton: {
    marginTop: 10,
  },
});

export default EmojiPickerModal;

import React from "react";
import { View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import Modal from "../common/Modal";
import { Body } from "../common/Typography";
import { theme } from "../../theme";

// Predefined color palette
const COLORS = [
  theme.colors.primary,
  theme.colors.secondary,
  theme.colors.tertiary,
  "#FF6B6B", // Red
  "#FF9E6B", // Orange
  "#FFDE6B", // Yellow
  "#6BCB77", // Green
  "#6BCEFF", // Light blue
  "#6B7CFF", // Blue
  "#D56BFF", // Purple
  "#FF6BD9", // Pink
  "#8E8E8E", // Gray
];

const ColorPicker = ({ visible, initialColor, onSelect, onClose }) => {
  const renderColorItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.colorItem,
        { backgroundColor: item },
        item === initialColor && styles.selectedItem,
      ]}
      onPress={() => onSelect(item)}
    />
  );

  return (
    <Modal visible={visible} onClose={onClose} title="Choose Color">
      <Body style={styles.description}>
        Select a color for your habit to help you identify it easily.
      </Body>

      <FlatList
        data={COLORS}
        renderItem={renderColorItem}
        keyExtractor={(item) => item}
        numColumns={4}
        contentContainerStyle={styles.colorGrid}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  description: {
    marginBottom: theme.spacing.medium,
    color: theme.colors.darkGray,
  },
  colorGrid: {
    paddingVertical: theme.spacing.small,
  },
  colorItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    margin: 8,
    ...theme.shadows.small,
  },
  selectedItem: {
    borderWidth: 3,
    borderColor: theme.colors.black,
  },
});

export default ColorPicker;

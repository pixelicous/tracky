import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "../common/Modal";
import { Body, Caption } from "../common/Typography";
import { theme } from "../../theme";

// Common icons for habits
const COMMON_ICONS = [
  "water",
  "bicycle",
  "barbell",
  "book",
  "body",
  "bed",
  "walk",
  "fitness",
  "cafe",
  "medical",
  "leaf",
  "cellular",
  "color-palette",
  "earth",
  "flask",
  "heart",
  "home",
  "language",
  "musical-notes",
  "school",
  "timer",
  "paw",
  "pizza",
  "sunny",
  "moon",
  "cloudy-night",
  "rainy",
  "snow",
  "thunderstorm",
  "flower",
  "alarm",
  "analytics",
  "archive",
  "bandage",
  "basketball",
  "beer",
  "bicycle",
  "brush",
  "bug",
  "build",
  "bulb",
  "bus",
  "business",
  "cafe",
  "calculator",
  "calendar",
  "call",
  "camera",
  "car",
  "card",
  "cart",
  "cash",
  "chatbubbles",
  "checkbox",
  "clipboard",
  "cloud-upload",
  "code",
  "cog",
  "compass",
  "construct",
  "contrast",
  "copy",
  "crop",
  "cube",
  "cut",
  "desktop",
  "disc",
  "document",
  "download",
  "easel",
  "egg",
  "exit",
  "expand",
  "eye",
  "fast-food",
  "female",
  "film",
  "finger-print",
  "flash",
  "football",
  "game-controller",
  "gift",
  "git-branch",
  "glasses",
  "globe",
  "grid",
  "hammer",
  "hand",
  "happy",
  "headset",
  "help-buoy",
  "ice-cream",
  "images",
  "infinite",
  "information-circle",
  "journal",
];

const IconPicker = ({
  visible,
  initialIcon,
  color = theme.colors.primary,
  onSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredIcons, setFilteredIcons] = useState(COMMON_ICONS);

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.trim() === "") {
      setFilteredIcons(COMMON_ICONS);
    } else {
      const filtered = COMMON_ICONS.filter((icon) =>
        icon.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredIcons(filtered);
    }
  };

  const renderIconItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.iconItem, item === initialIcon && styles.selectedItem]}
      onPress={() => onSelect(item)}
    >
      <Ionicons name={item} size={30} color={color} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} onClose={onClose} title="Choose Icon">
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.darkGray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search icons..."
          value={searchTerm}
          onChangeText={handleSearch}
          placeholderTextColor={theme.colors.gray}
        />
      </View>

      <Caption style={styles.hint}>Scroll to see more icons</Caption>

      <FlatList
        data={filteredIcons}
        renderItem={renderIconItem}
        keyExtractor={(item) => item}
        numColumns={4}
        contentContainerStyle={styles.iconGrid}
        style={styles.iconList}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  searchIcon: {
    marginRight: theme.spacing.small,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.black,
    paddingVertical: 10,
  },
  hint: {
    marginBottom: theme.spacing.small,
    color: theme.colors.darkGray,
    textAlign: "center",
  },
  iconList: {
    maxHeight: 400,
  },
  iconGrid: {
    paddingVertical: theme.spacing.small,
  },
  iconItem: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.borderRadius.medium,
    margin: 8,
    backgroundColor: theme.colors.white,
    ...theme.shadows.small,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
});

export default IconPicker;

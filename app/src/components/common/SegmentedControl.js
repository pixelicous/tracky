import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

const SegmentedControl = ({ values, selectedIndex, onChange }) => {
  return (
    <View style={styles.container}>
      {values.map((value, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            selectedIndex === index && styles.selectedSegment,
          ]}
          onPress={() =>
            onChange({ nativeEvent: { selectedSegmentIndex: index } })
          }
        >
          <Text
            style={[
              styles.segmentText,
              selectedIndex === index && styles.selectedSegmentText,
            ]}
          >
            {value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.spacing.small,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.small,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSegment: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.darkGray,
  },
  selectedSegmentText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.medium,
  },
});

export default SegmentedControl;

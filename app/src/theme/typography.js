import { Platform } from "react-native";

export const FONTS = {
  regular: Platform.OS === "ios" ? "SFProText-Regular" : "Roboto-Regular",
  medium: Platform.OS === "ios" ? "SFProText-Medium" : "Roboto-Medium",
  semiBold: Platform.OS === "ios" ? "SFProText-Semibold" : "Roboto-SemiBold",
  bold: Platform.OS === "ios" ? "SFProText-Bold" : "Roboto-Bold",
};

export const FONT_SIZES = {
  xs: 10,
  small: 12,
  medium: 14,
  large: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  header: 32,
};

export default { FONTS, FONT_SIZES };

import { COLORS } from "./colors";
import { FONTS, FONT_SIZES } from "./typography";
import { SPACING } from "./spacing";
import { SHADOWS } from "./shadows";

export const theme = {
  colors: COLORS,
  fonts: FONTS,
  fontSizes: FONT_SIZES,
  spacing: SPACING,
  shadows: SHADOWS,

  borderRadius: {
    small: 6,
    medium: 12,
    large: 16,
    xl: 24,
    round: 999,
  },

  radii: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },

  // App-specific theme constants
  habit: {
    cardHeight: 90,
    iconSize: 36,
  },

  animation: {
    timing: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
  },
};

export default theme;

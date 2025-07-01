import chroma from "chroma-js";

export const GRAVITY = {
  ZERO_GRAVITY: 0,
  LOW_GRAVITY: 0.1,
  HIGH_GRAVITY: 0.5,
} as const;
export type Gravity = (typeof GRAVITY)[keyof typeof GRAVITY];

export const NODE_SIZE_SCALE = {
  INVISIBLE: 0,
  EXTRA_SMALL: 0.25,
  SMALL: 0.5,
  MEDIUM: 1,
  LARGE: 1.5,
  EXTRA_LARGE: 2,
} as const;
export type NodeSizeScale =
  (typeof NODE_SIZE_SCALE)[keyof typeof NODE_SIZE_SCALE];

export const MODE = {
  COLOR_IMPORTANT: 1,
  COLOR_SHADE_DEFAULT: 2,
  COLOR_SHADE_ERROR: 3,
  SIZE_SCALAR: 4,
  RAINBOW: 5,
} as const;

export const DEFAULT_NODE_SIZE = 7;
export const INACTIVE_NODE_SIZE = 7;
export const HIGHLIGHTED_LINK_WIDTH = 4;
export const DEFAULT_LINK_WIDTH = 2;
export const GRADIENT_COLOR = chroma.scale(["#FD4958", "#D17600"]); // --red-5 to --yellow-5
export const NEUTRAL_COLOR = "#757575"; // Gray color
export const POSITIVE_COLOR = "#36A138"; // --color-green-5
export const CRITICAL_COLOR = "#FD4958"; // --color-red-5
export const NEUTRAL_LOW_COLOR = "#B0B0B0"; // Muted gray color
export const DISABLED_COLOR = "#888888"; // More muted gray color

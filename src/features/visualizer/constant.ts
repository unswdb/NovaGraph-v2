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

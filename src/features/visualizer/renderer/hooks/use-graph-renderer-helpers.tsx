import { useMemo } from "react";
import type { ColorMap, SizeMap } from "../../algorithms/implementations";
import type { GraphEdge } from "../../types";
import { MODE } from "../../constant";
import chroma from "chroma-js";

const DEFAULT_NODE_SIZE = 7;
const INACTIVE_NODE_SIZE = 7;
const HIGHLIGHTED_LINK_WIDTH = 4;
const DEFAULT_LINK_WIDTH = 2;
const GRADIENT_COLOR = chroma.scale(["#FD4958", "#D17600"]); // --red-5 to --yellow-5
const NEUTRAL_COLOR = "#757575"; // Gray color
const CRITICAL_COLOR = "#FD4958"; // --color-red-5
const NEUTRAL_LOW_COLOR = "#B0B0B0"; // Muted gray color
const DISABLED_COLOR = "#888888"; // More muted gray color

export const useGraphRendererHelpers = ({
  mode,
  colors,
  sizes,
  directed,
}: {
  mode: number;
  colors: ColorMap;
  sizes: SizeMap;
  directed: boolean;
}) => {
  const getNodeSize = useMemo(
    () =>
      (index: number): number => {
        if (mode === MODE.COLOR_SHADE_DEFAULT && isNaN(colors[index])) {
          return INACTIVE_NODE_SIZE;
        }
        return sizes[index] || DEFAULT_NODE_SIZE;
      },
    [mode, colors, sizes]
  );

  const getNodeColor = useMemo(
    () =>
      (index: number): string => {
        switch (mode) {
          case MODE.COLOR_IMPORTANT:
            return colors[index] > 0
              ? GRADIENT_COLOR(1).hex()
              : colors[index] < 0
              ? CRITICAL_COLOR
              : NEUTRAL_COLOR;
          case MODE.COLOR_SHADE_DEFAULT:
            return isNaN(colors[index])
              ? DISABLED_COLOR
              : GRADIENT_COLOR(colors[index]).hex();
          case MODE.COLOR_SHADE_ERROR:
            return isNaN(colors[index])
              ? CRITICAL_COLOR
              : GRADIENT_COLOR(colors[index]).hex();
          case MODE.SIZE_SCALAR:
            return NEUTRAL_COLOR;
          case MODE.RAINBOW:
            return `hsl(${colors[index] * 137.508 + 50},100%,75%)`;
          default:
            return NEUTRAL_COLOR;
        }
      },
    [mode, colors]
  );

  const getLinkColor = useMemo(
    () =>
      (link: GraphEdge): string | null => {
        const forwardKey = `${link.source}-${link.target}`;
        const backwardKey = `${link.target}-${link.source}`;

        if (colors[forwardKey] > 0) {
          return NEUTRAL_LOW_COLOR;
        }
        if (!directed && colors[backwardKey] > 0) {
          return NEUTRAL_LOW_COLOR;
        }
        if (colors[backwardKey] === 0) {
          return GRADIENT_COLOR(1).hex();
        }
        if (!directed && colors[forwardKey] === 0) {
          return GRADIENT_COLOR(1).hex();
        }
        return null;
      },
    [colors, directed]
  );

  const getLinkWidth = useMemo(
    () =>
      (link: GraphEdge): number => {
        const forwardKey = `${link.source}-${link.target}`;
        const backwardKey = `${link.target}-${link.source}`;

        if (colors[forwardKey] >= 0) {
          return HIGHLIGHTED_LINK_WIDTH;
        }
        if (!directed && colors[backwardKey] >= 0) {
          return HIGHLIGHTED_LINK_WIDTH;
        }
        return DEFAULT_LINK_WIDTH;
      },
    [colors, directed]
  );

  return { getNodeSize, getNodeColor, getLinkColor, getLinkWidth };
};

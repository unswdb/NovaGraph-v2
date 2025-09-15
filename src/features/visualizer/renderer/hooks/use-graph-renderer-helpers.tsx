import { useMemo } from "react";
import type { ColorMap, SizeMap } from "../../algorithms/implementations";
import type { GraphEdge } from "../../types";
import { MODE } from "../../constant";
import chroma from "chroma-js";

const DEFAULT_NODE_SIZE = 7;
const INACTIVE_NODE_SIZE = 7;
const HIGHLIGHTED_LINK_WIDTH = 4;
const DEFAULT_LINK_WIDTH = 2;
const GRADIENT_COLOR = chroma.scale(["#eadeff", "#5f5ffa"]);
const NEUTRAL_COLOR = "#757575";
const CRITICAL_COLOR = "#fd4958";
const PRIMARY_LOW_COLOR = "#5f5ffacc";
const DISABLED_COLOR = "#888888";

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
        const value = colors[index];
        switch (mode) {
          case MODE.COLOR_IMPORTANT:
            return value > 0
              ? GRADIENT_COLOR(1).hex()
              : value < 0
              ? CRITICAL_COLOR
              : NEUTRAL_COLOR;
          case MODE.COLOR_SHADE_DEFAULT:
            return isNaN(value) ? DISABLED_COLOR : GRADIENT_COLOR(value).hex();
          case MODE.COLOR_SHADE_ERROR:
            return isNaN(value) ? CRITICAL_COLOR : GRADIENT_COLOR(value).hex();
          case MODE.SIZE_SCALAR:
            return NEUTRAL_COLOR;
          case MODE.RAINBOW:
            return `hsl(${value * 137.508 + 50},100%,75%)`;
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
          return PRIMARY_LOW_COLOR;
        }
        if (!directed && colors[backwardKey] > 0) {
          return PRIMARY_LOW_COLOR;
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

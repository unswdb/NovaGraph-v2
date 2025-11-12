import type { GraphNode } from "~/features/visualizer/types";
import type { MainModule } from "~/graph";

export type IgraphInput = {
  nodes: number; // nodes number
  src: Int32Array; // length = E
  dst: Int32Array; // length = E
  directed: boolean; // true = directed
  weight?: Float64Array | Float32Array; // optional, length = E
};

export type KuzuToIgraphParseResult = {
  IgraphInput: IgraphInput;
  KuzuToIgraphMap: Map<string, number>; // Map Kuzu ID to Igraph ID
  IgraphToKuzuMap: Map<number, string>; // Map back Igraph ID to Kuzu ID
  nodesMap: Map<string, GraphNode>; // Map back kuzu id to nodes
};

type NodeId = string;
type EdgeId = string; // Format: "fromNodeId-toNodeId"
type ColorValue = number; // 0.5 for partial highlight, 1 for full highlight, or frequency-based values

export type ColorMap = {
  [key: NodeId | EdgeId]: ColorValue;
};

export type SizeMap = {
  [key: NodeId]: number;
};

export type BaseGraphAlgorithmResult = {
  colorMap: ColorMap;
  sizeMap?: SizeMap;
  mode: number;
};

export const MODE = {
  COLOR_IMPORTANT: 1,
  COLOR_SHADE_DEFAULT: 2,
  COLOR_SHADE_ERROR: 3,
  SIZE_SCALAR: 4,
  RAINBOW: 5,
} as const;

export type GraphModule = MainModule;

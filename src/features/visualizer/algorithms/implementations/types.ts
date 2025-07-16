import type { ReactNode } from "react";
import type { GraphModule } from "../../types";
import type { GraphAlgorithmInput } from "../inputs";

type NodeId = string;
type EdgeId = string; // Format: "fromNodeId-toNodeId"
type ColorValue = number; // 0.5 for partial highlight, 1 for full highlight, or frequency-based values

export type ColorMap = {
  [key: NodeId | EdgeId]: ColorValue;
};

export type SizeMap = {
    [key: NodeId]: number;
  };

export interface BaseGraphAlgorithmResult {
  colorMap: ColorMap;
  sizeMap?: SizeMap;
  mode: number;
};

export interface GraphAlgorithmResult<TData = unknown> extends BaseGraphAlgorithmResult {
  data: TData;
};

// Type-erased base algorithm for generic lists
export interface BaseGraphAlgorithm {
  title: string;
  description: string;
  inputs: GraphAlgorithmInput[];
  wasmFunction: (module: GraphModule | null, args: any[]) => any;
  output: (props: BaseGraphAlgorithmResult) => ReactNode;
}

export interface GraphAlgorithm<TData = unknown> {
  title: string;
  description: string;
  inputs: GraphAlgorithmInput[];
  wasmFunction: (module: GraphModule | null, args: any[]) => any;
  output: (props: GraphAlgorithmResult<TData>) => ReactNode;
}

// Helper function for better type inference
export function createGraphAlgorithm<TData>(config: {
  title: string;
  description: string;
  inputs: GraphAlgorithmInput[];
  wasmFunction: (module: GraphModule | null, args: any[]) => any;
  output: (props: GraphAlgorithmResult<TData>) => ReactNode;
}): GraphAlgorithm<TData> {
  return config;
}

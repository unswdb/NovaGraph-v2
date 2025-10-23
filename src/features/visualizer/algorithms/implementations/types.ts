import type { ReactNode } from "react";

import type { InputType } from "../../inputs";
import type VisualizerStore from "../../store";

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
  type: "algorithm";
  colorMap: ColorMap;
  sizeMap?: SizeMap;
  mode: number;
}

export interface GraphAlgorithmResult<TData = unknown>
  extends BaseGraphAlgorithmResult {
  data: TData;
}

type BivariantHandler<T> = {
  bivarianceHack(props: T): ReactNode;
}["bivarianceHack"];

// Type-erased base algorithm for generic lists
export interface BaseGraphAlgorithm<TResult = BaseGraphAlgorithmResult> {
  title: string;
  description: string;
  inputs: InputType[];
  wasmFunction: (
    controller: VisualizerStore["controller"],
    args: any[]
  ) => Promise<TResult>;
  output: BivariantHandler<TResult>;
}

/** TData describes the format/structure of the output in addition from
 * colorMap, sizeMap, etc. Please refer to wasm/algorithms/ to inspect
 * the correct structure for your algorithm
 */
export interface GraphAlgorithm<TData = unknown>
  extends BaseGraphAlgorithm<GraphAlgorithmResult<TData>> {}

// Helper function for better type inference
export function createGraphAlgorithm<TData>(config: {
  title: string;
  description: string;
  inputs: InputType[];
  wasmFunction: (
    controller: VisualizerStore["controller"],
    args: any[]
  ) => Promise<Omit<GraphAlgorithmResult<TData>, "type">>;
  output: (props: GraphAlgorithmResult<TData>) => ReactNode;
}): GraphAlgorithm<TData> {
  const algorithmWasmFn = async (
    controller: VisualizerStore["controller"],
    args: any[]
  ) => {
    const res = await config.wasmFunction(controller, args);
    return { ...res, type: "algorithm" } as const;
  };
  return { ...config, wasmFunction: algorithmWasmFn };
}

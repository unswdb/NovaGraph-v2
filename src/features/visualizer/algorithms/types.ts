import type { ReactNode } from "react";

type SelectInput = {
  label: string;
  type: "select";
  source: "nodes" | "edges" | "static"; // Where select options come from
  multiple?: boolean; // For multi-select
  options?: string[]; // For static options
};

type NumberInput = {
  label: string;
  type: "number";
  min?: number;
  max?: number;
};

type GraphAlgorithmInput = SelectInput | NumberInput;

export interface BaseGraphAlgorithm {
  title: string;
  description: string;
  inputs: GraphAlgorithmInput[];
  wasmFunction: string; // The WASM function that executes this algorithm
  output: (result: any) => ReactNode; // Type-erased for collections
}

// Generic interface for type-safe individual algorithms
export interface GraphAlgorithm<TResult = unknown> extends BaseGraphAlgorithm {
  output: (result: TResult) => ReactNode;
}

// Helper function for better type inference
export function createGraphAlgorithm<TResult>(config: {
  title: string;
  description: string;
  inputs: GraphAlgorithmInput[];
  wasmFunction: string;
  output: (result: TResult) => ReactNode;
}): GraphAlgorithm<TResult> {
  return config;
}

// Base types and enums
type NodeId = string;
type EdgeId = string; // Format: "fromNodeId-toNodeId"
type ColorValue = number; // 0.5 for partial highlight, 1 for full highlight, or frequency-based values

type ColorMap = {
  [key: NodeId | EdgeId]: ColorValue;
};

export type GraphAlgorithmResult<TData = unknown> = {
  colorMap: ColorMap;
  mode: string;
  data: TData;
};

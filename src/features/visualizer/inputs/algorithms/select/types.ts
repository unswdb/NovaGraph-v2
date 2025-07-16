import type { BaseInputType } from "../../types";

export type AlgorithmSelectInput = BaseInputType & {
  type: "algorithm-select";
  source: "nodes" | "edges" | "static"; // Where select options come from
  multiple?: boolean; // For multi-select
  options?: string[]; // For static options
};

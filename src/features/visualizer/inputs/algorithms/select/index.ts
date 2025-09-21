import type { GraphEdge, GraphNode } from "~/features/visualizer/types";
import type { AlgorithmSelectInput, BaseSelectInput } from "./types";

export function createAlgorithmSelectInput(
  input:
    | (BaseSelectInput & {
        source: "nodes";
        blacklist?: GraphNode[];
      })
    | (BaseSelectInput & {
        source: "edges";
        blacklist?: GraphEdge[];
      })
    | (BaseSelectInput & {
        source: "static";
        options: string[];
        blacklist?: string[];
      })
): AlgorithmSelectInput {
  return {
    type: "algorithm-select",
    multiple: false,
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { AlgorithmSelectInput } from "./types";
export { default as SelectInputComponent } from "./select-input";

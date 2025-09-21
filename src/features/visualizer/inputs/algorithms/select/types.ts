import type { GraphEdge, GraphNode } from "~/features/visualizer/types";
import type { BaseInputType } from "../../types";

export type BaseSelectInput = BaseInputType<string> & {
  multiple?: boolean; // For multi-select
};

export type AlgorithmSelectInput = BaseSelectInput & {
  type: "algorithm-select";
} & (
    | {
        source: "nodes";
        blacklist?: GraphNode[];
      }
    | {
        source: "edges";
        blacklist?: GraphEdge[];
      }
    | {
        source: "static";
        options: string[];
        blacklist?: string[];
      }
  );

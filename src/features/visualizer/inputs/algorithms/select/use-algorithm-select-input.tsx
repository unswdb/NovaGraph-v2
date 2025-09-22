import { useState } from "react";
import type { GraphEdge, GraphNode } from "~/features/visualizer/types";
import type { AlgorithmSelectInput } from "./types";

export default function useAlgorithmSelectInputValue<
  I extends AlgorithmSelectInput
>(input: I) {
  type Value = I extends { source: "nodes" }
    ? GraphNode
    : I extends { source: "edges" }
    ? GraphEdge
    : I extends { source: "static" }
    ? string
    : never;

  return useState<Value | undefined>();
}

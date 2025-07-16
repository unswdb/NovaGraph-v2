import type { GraphAlgorithmInput } from ".";
import type { GraphEdge, GraphNode } from "../../types";

export type AlgorithmInputComponentProps<T = GraphAlgorithmInput> = {
  input: T;
  nodes: GraphNode[];
  edges: GraphEdge[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
};

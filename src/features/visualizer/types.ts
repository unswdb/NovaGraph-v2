// TODO (Change where to infer): Infered from src/wasm/generators/generator.cpp
export type GraphNode = {
  id: string;
  label?: string;
  attributes?: Record<string, string>; // Additional attributes for the node
};

export type GraphEdge = {
  source: string;
  target: string;
  weight?: number; // Optional weight for the edge
};

export type GraphDatabase = {
  label: string;
  graph: { nodes: GraphNode[]; edges: GraphEdge[]; directed: boolean };
};

export { type MainModule as GraphModule } from "~/graph";

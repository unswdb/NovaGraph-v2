// Infered from src/wasm/generators/generator.cpp
export type GraphNode = {
  id: string;
  name?: string;
};

export type GraphEdge = {
  source: string;
  target: string;
};

export type GraphDatabase = {
  label: string;
  graph: { nodes: GraphNode[]; edges: GraphEdge[]; directed: boolean; };
};

export { type MainModule as GraphModule } from "~/graph";
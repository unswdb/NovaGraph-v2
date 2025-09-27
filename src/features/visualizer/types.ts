export type GraphNode = {
  id: string; // Unique identifier of the node
  tableName: string; // Unique identifier of the table it belongs to
  label?: string; // Node name/label to display
  attributes?: Record<string, string | boolean | number>; // Additional attributes for the node
};

export type GraphEdge = {
  source: string; // Unique identifier of the node
  target: string; // Unique identifier of the node
  weight?: number; // Optional weight for the edge
  attributes?: Record<string, string | boolean | number>; // Additional attributes for the edge
};

export type GraphDatabase = {
  label: string;
  graph: { nodes: GraphNode[]; edges: GraphEdge[]; directed: boolean };
};

export { type MainModule as GraphModule } from "~/graph";

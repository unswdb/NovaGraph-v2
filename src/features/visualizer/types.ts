import type { NonPrimaryKeyType, PrimaryKeyType } from "./schema-inputs";

export type GraphNode = {
  id: string; // Unique identifier of the node
  _primaryKey: string;
  // Unique identifier of the node in the table.
  // Multiple nodes can have the same primary key value (if they're in a different table).
  _primaryKeyValue: string | number;
  tableName: string; // The table the node belongs to
  // Additional attributes for the node (doesn't include primaryKey)
  attributes?: Record<string, string | boolean | number>;
};

export type GraphEdge = {
  source: string; // Unique identifier of the node
  target: string; // Unique identifier of the node
  weight: number; // Weight for the edge. Default value is 0
  attributes?: Record<string, string | boolean | number>; // Additional attributes for the edge
};

export type GraphSchema = {
  tableName: string;
  tableType: "NODE" | "REL";
  primaryKey: string;
  primaryKeyType: PrimaryKeyType;
  properties: {
    [key: string]: NonPrimaryKeyType;
  };
};

export type GraphDatabase = {
  label: string;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    nodesMap: Map<string, GraphNode>;
    edgesMap: Map<[string, string], GraphEdge>;
    schema: GraphSchema[];
    directed: boolean;
  };
};

export { type MainModule as GraphModule } from "~/graph";

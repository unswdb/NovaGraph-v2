import type {
  NonPrimaryKeyType,
  NonPrimaryKeyValueType,
  PrimaryKeyType,
  PrimaryKeyValueType,
} from "./schema-inputs";
import type KuzuBaseService from "~/kuzu/services/KuzuBaseService";

export type GraphNode = {
  id: string; // Unique identifier of the node
  _primaryKey: string;
  // Unique identifier of the node in the table.
  // Multiple nodes can have the same primary key value (if they're in a different table).
  _primaryKeyValue: PrimaryKeyValueType;
  tableName: string; // The table the node belongs to
  // Additional attributes for the node (doesn't include primaryKey)
  attributes?: Record<string, NonPrimaryKeyValueType>;
};

export type GraphEdge = {
  source: string; // Unique identifier of the node
  target: string; // Unique identifier of the node
  tableName: string; // The table the egde belongs to
  attributes?: Record<string, NonPrimaryKeyValueType>; // Additional attributes for the edge
};

type BaseGraphSchema = {
  tableName: string;
  primaryKey: string;
  primaryKeyType: PrimaryKeyType;
  properties: {
    [key: string]: NonPrimaryKeyType;
  };
};

export type NodeSchema = BaseGraphSchema & { tableType: "NODE" };
export function isNodeSchema(s: GraphSchema): s is NodeSchema {
  return s.tableType === "NODE";
}

export type EdgeSchema = BaseGraphSchema & { tableType: "REL" };
export function isEdgeSchema(s: GraphSchema): s is EdgeSchema {
  return s.tableType === "REL";
}

export type GraphSchema = NodeSchema | EdgeSchema;

export type GraphDatabase = {
  label: string;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    nodesMap: Map<string, GraphNode>;
    edgesMap: Map<[string, string], GraphEdge>;
    nodeTables: NodeSchema[];
    nodeTablesMap: Map<string, NodeSchema>;
    edgeTables: EdgeSchema[];
    edgeTablesMap: Map<string, EdgeSchema>;
    directed: boolean;
  };
};

export type ExecuteQueryResult = ReturnType<KuzuBaseService["executeQuery"]>;

export { type MainModule as GraphModule } from "~/graph";

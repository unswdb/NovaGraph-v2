import type { BaseGraphAlgorithmResult } from "./algorithms/implementations";
import type { QueryVisualizationResult } from "./queries";
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

export type BaseGraphSchema = {
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

export type EdgeSchema = BaseGraphSchema & { tableType: "REL" } & {
  sourceTableName: string;
  targetTableName: string;
};
export function isEdgeSchema(s: GraphSchema): s is EdgeSchema {
  return s.tableType === "REL";
}

export type GraphSchema = NodeSchema | EdgeSchema;

export function createSchema(s: NodeSchema): NodeSchema;
export function createSchema(s: EdgeSchema): EdgeSchema;
export function createSchema(s: GraphSchema): GraphSchema {
  return s;
}

export type GraphDatabase = {
  name: string;
  persistent: boolean; // true if stored in kuzu, false if in-memory only
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
export type VisualizationResponse =
  | BaseGraphAlgorithmResult
  | QueryVisualizationResult;

export function isQueryVisualizationResult(
  response: VisualizationResponse
): response is QueryVisualizationResult {
  return response.type === "query";
}

export function isAlgorithmVisualizationResult(
  response: VisualizationResponse
): response is BaseGraphAlgorithmResult {
  return response.type === "algorithm";
}

export type GraphSnapshotState = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeTables: NodeSchema[];
  edgeTables: EdgeSchema[];
  directed?: boolean;
};

export const EMPTY_SNAPSHOT_GRAPH_STATE: GraphSnapshotState = {
  nodes: [],
  edges: [],
  nodeTables: [],
  edgeTables: [],
};

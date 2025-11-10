import {
  isEdgeSchema,
  isNodeSchema,
  type EdgeSchema,
  type GraphEdge,
  type GraphNode,
  type NodeSchema,
} from "~/features/visualizer/types";
import {
  getAllSchemaPropertiesQuery,
  getSingleSchemaPropertiesQuery,
} from "../helpers/KuzuQueryBuilder";
import {
  parseNodesResult,
  parseEdgesResult,
  parseTablesResult,
  parseSingleTableResult,
  processQueryResult,
} from "./KuzuQueryResultExtractor";
import type Connection from "../types/kuzu_wasm_internal/connection";

// @ts-ignore 'kuzu-wasm/sync' is a JS api file from kuzu-wasm node module
import kuzu from "kuzu-wasm/sync";
import {
  NON_PK_SCHEMA_TYPES,
  PK_SCHEMA_TYPES,
} from "~/features/visualizer/schema-inputs";
import type { ErrorQueryResult } from "./KuzuQueryResultExtractor.types";

export function validateQuery(connection: Connection, query: string) {
  const tempDb = new kuzu.Database(":memory:");
  const tempConnection = new kuzu.Connection(tempDb);

  const result = tempConnection.query(query);
  const processed = processQueryResult(result);

  if (!processed.success) {
    tempDb.close();
    return;
  }

  const { nodeTables: tempNodeTables, edgeTables: tempEdgeTables } =
    snapshotGraphState(tempConnection);

  const failedQueries: ErrorQueryResult[] = [];
  for (const t of [...tempNodeTables, ...tempEdgeTables]) {
    if (!PK_SCHEMA_TYPES.includes(t.primaryKeyType)) {
      failedQueries.push({
        success: false,
        message: `Unsupported primary-key type ${t.primaryKeyType} for field "${t.primaryKey}" in table ${t.tableName}. Supported types are: ${PK_SCHEMA_TYPES.join(", ")}`,
      });
    }
    for (const [field, type] of Object.entries(t.properties)) {
      if (!NON_PK_SCHEMA_TYPES.includes(type)) {
        failedQueries.push({
          success: false,
          message: `Unsupported non-primary key type ${type} for field "${field}" in table ${t.tableName}. Supported types are: ${NON_PK_SCHEMA_TYPES.join(", ")}`,
        });
      }
    }
  }

  tempDb.close();

  const { nodes, edges, nodeTables, edgeTables } =
    snapshotGraphState(connection);

  return {
    successQueries: [],
    failedQueries,
    success: failedQueries.length === 0,
    message:
      failedQueries.length === 0
        ? `All queries succeeded`
        : `Some queries failed. Check results for details.`,
    nodes,
    edges,
    nodeTables,
    edgeTables,
    colorMap: {},
    resultType: "graph",
  };
}

/**
 * Snapshot the current state of the graph (nodes and relationships)
 * @returns {Object} Result with all nodes and relationships
 */
export function snapshotGraphState(connection: Connection): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeTables: NodeSchema[];
  edgeTables: EdgeSchema[];
} {
  const nodesResult = connection.query(`MATCH (n) RETURN n`);
  const nodes = parseNodesResult(nodesResult, connection);

  const edgesResult = connection.query(`MATCH ()-[r]->() RETURN r`);
  const edges = parseEdgesResult(edgesResult);

  const tablesResult = connection.query(getAllSchemaPropertiesQuery());
  const tablesWithoutProps = parseTablesResult(tablesResult);

  let nodeTables: NodeSchema[] = [];
  let edgeTables: EdgeSchema[] = [];
  for (const table of tablesWithoutProps) {
    const tableWithPropsResult = connection.query(
      getSingleSchemaPropertiesQuery(table.tableName)
    );
    const tableWithProps = parseSingleTableResult(tableWithPropsResult);
    if (tableWithProps) {
      const newTable = { ...table, ...tableWithProps };
      if (isEdgeSchema(newTable)) {
        edgeTables.push(newTable);
      } else if (isNodeSchema(newTable)) {
        nodeTables.push(newTable);
      }
    }
  }

  return { nodes, edges, edgeTables, nodeTables };
}

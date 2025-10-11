import type {
  GraphEdge,
  GraphNode,
  GraphSchema,
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
} from "./KuzuQueryResultExtractor";

// type ConnectionSync = import("../../types/kuzu-wasm/sync/connection");

/**
 * Snapshot the current state of the graph (nodes and relationships)
 * @returns {Object} Result with all nodes and relationships
 */
// export function snapshotGraphState(connection: ConnectionSync) {
export function snapshotGraphState(connection: any): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tables: GraphSchema[];
} {
  const nodesResult = connection.query(`MATCH (n) RETURN n`);
  const nodes = parseNodesResult(nodesResult, connection);

  const edgesResult = connection.query(`MATCH ()-[r]->() RETURN r`);
  const edges = parseEdgesResult(edgesResult);

  const tablesResult = connection.query(getAllSchemaPropertiesQuery());
  const tablesWithoutProps = parseTablesResult(tablesResult);

  let tables: GraphSchema[] = [];
  for (const table of tablesWithoutProps) {
    const tableWithPropsResult = connection.query(
      getSingleSchemaPropertiesQuery(table.tableName)
    );
    const tableWithProps = parseSingleTableResult(tableWithPropsResult);
    if (tableWithProps) tables.push({ ...table, ...tableWithProps });
  }

  return { nodes, edges, tables };
}

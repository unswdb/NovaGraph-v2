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

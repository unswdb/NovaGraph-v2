import {
  getAllSchemaPropertiesQuery,
  getEdgeSchemaConnectionQuery,
  getSingleSchemaPropertiesQuery,
} from "./KuzuQueryBuilder";
import {
  parseNodesResult,
  parseEdgesResult,
  parseTablesResult,
  parseSingleTableResult,
  parseTableConnection,
} from "./KuzuQueryResultExtractor";

import {
  type EdgeSchema,
  type GraphEdge,
  type GraphNode,
  type NodeSchema,
} from "~/features/visualizer/types";

// TODO: finish correct internal type of kuzu first 
// type ConnectionSync = import("../../types/kuzu-wasm/sync/connection");

/**
 * Snapshot the current state of the graph (nodes and relationships)
 * @returns {Object} Result with all nodes and relationships
 */
// export function snapshotGraphState(connection: ConnectionSync) {
export function snapshotGraphState(connection: any): {
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

      if (newTable.tableType === "REL") {
        const edgeSchemaConnectionResult = connection.query(
          getEdgeSchemaConnectionQuery(newTable.tableName)
        );
        // console.log(edgeSchemaConnectionResult, newTable.tableName, tablesResult);
        const edgeSchemaConnection = parseTableConnection(
          edgeSchemaConnectionResult
        );
        if (edgeSchemaConnection) {
          const edgeTable: EdgeSchema = {
            ...newTable,
            tableType: "REL",
            ...edgeSchemaConnection,
          };
          edgeTables.push(edgeTable);
        }
      } else if (newTable.tableType === "NODE") {
        nodeTables.push({ ...newTable, tableType: "NODE" });
      }
    }
  }

  return { nodes, edges, edgeTables, nodeTables };
}

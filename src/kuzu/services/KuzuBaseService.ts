import { snapshotGraphState } from "../helpers/KuzuQueryExecutor";
import {
  queryResultColorMapExtraction,
  processQueryResult,
} from "../helpers/KuzuQueryResultExtractor";
import {
  createSchemaQuery,
  createNodeQuery,
  findPrimaryKeyQuery,
  deleteNodeQuery,
  createEdgeSchemaQuery,
  createEdgeQuery,
  createNodeSchemaQuery,
  updateEdgeQuery,
  updateNodeQuery,
  deleteEdgeQuery,
} from "../helpers/KuzuQueryBuilder";
import type {
  ErrorQueryResult,
  SuccessQueryResult,
} from "../helpers/KuzuQueryResultExtractor.types";
import type Connection from "../types/kuzu_wasm_internal/connection";

import { throwOnFailedQuery } from "./KuzuBaseService.util";

import type { CompositeType } from "~/kuzu/types/KuzuDBTypes";
import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { InputChangeResult } from "~/features/visualizer/inputs";

export default class KuzuBaseService {
  protected db: any;
  protected connection: Connection | null = null;
  protected helper: any = null;
  protected initialized: boolean = false;

  constructor() {
    this.db = null;
    this.connection = null;
    this.helper = null;
    this.initialized = false;
  }

  snapshotGraphState() {
    return snapshotGraphState(this.connection);
  }

  /**
   * Execute a Cypher query and process the results
   * @param {string} query - The Cypher query to execute
   * @returns {Object} - Query execution result object
   */
  executeQuery(query: string) {
    if (!this.connection || !query.trim()) {
      throw new Error("Connection not initialized or empty query");
    }

    // Init variable
    const successQueries: SuccessQueryResult[] = [];
    const failedQueries: ErrorQueryResult[] = [];
    let allSuccess = true;
    let colorMap = {};
    let resultType = "graph";

    let currentResult = this.connection.query(query);

    // Loop through each query result and collect successnesss
    while (currentResult) {
      const queryResult = processQueryResult(currentResult);
      if (queryResult.success) {
        successQueries.push(queryResult);
      } else {
        allSuccess = false;
        failedQueries.push(queryResult);
      }

      // Check last query result
      if (currentResult.hasNextQueryResult()) {
        currentResult = currentResult.getNextQueryResult();
        continue;
      } else {
        colorMap = queryResultColorMapExtraction(currentResult);
        break;
      }
    }

    // Get snapshot set to nodes and edges
    const { nodes, edges, nodeTables, edgeTables } = snapshotGraphState(
      this.connection
    );

    // Gracefully close the query result object
    currentResult.close();

    return {
      successQueries: successQueries,
      failedQueries: failedQueries,
      success: allSuccess,
      message: allSuccess
        ? `All queries succeeded`
        : `Some queries failed. Check results for details.`,
      nodes: nodes,
      edges: edges,
      nodeTables,
      edgeTables,
      colorMap,
      resultType: resultType,
    };
  }

  /**
   * Create a node or relationship schema in the database.
   *
   * @param type - Either `"node"` or `"rel"`.
   * @param tableName - Label of the node or relationship.
   * @param properties - Array of property definitions.
   * @param relInfo - For relationships only: `{ fromLabel, toLabel, direction }`.
   * @returns Result of the schema creation query.
   */
  createSchema(
    type: "node" | "rel" | "NODE" | "REL",
    tableName: string,
    primaryKey: string | undefined,
    properties: Record<string, CompositeType>,
    relInfo: { from: string; to: string } | null = null
  ) {
    const query = createSchemaQuery(
      type,
      tableName,
      primaryKey,
      properties,
      relInfo
    );
    return throwOnFailedQuery(this.executeQuery(query));
  }

  createNodeSchema(
    tableName: string,
    primaryKey: string,
    primaryKeyType: PrimaryKeyType,
    properties: {
      name: string;
      type: NonPrimaryKeyType;
      isPrimary?: boolean;
    }[] = [],
    relInfo: { from: string; to: string } | null = null
  ) {
    const query = createNodeSchemaQuery(
      tableName,
      primaryKey,
      primaryKeyType,
      properties,
      relInfo
    );
    return throwOnFailedQuery(this.executeQuery(query));
  }

  createNode(
    tableName: string,
    properties: Record<
      string,
      { value: any; success?: boolean; message?: string }
    >
  ) {
    const query = createNodeQuery(tableName, properties);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  updateNode(node: GraphNode, values: Record<string, InputChangeResult<any>>) {
    const query = updateNodeQuery(node, values);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  findPrimaryKey(tableName: string) {
    const query = findPrimaryKeyQuery(tableName);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  deleteNode(node: GraphNode) {
    const query = deleteNodeQuery(
      node.tableName,
      node._primaryKey,
      node._primaryKeyValue
    );
    return throwOnFailedQuery(this.executeQuery(query));
  }

  createEdgeSchema(
    tableName: string,
    tablePairs: Array<[string | number, string | number]>,
    properties: (
      | { name: string; type: NonPrimaryKeyType }
      | { name: string; type: PrimaryKeyType }
    )[],
    relationshipType?: "MANY_ONE" | "ONE_MANY" | "MANY_MANY" | "ONE_ONE"
  ) {
    const query = createEdgeSchemaQuery(
      tableName,
      tablePairs,
      properties,
      relationshipType
    );
    return throwOnFailedQuery(this.executeQuery(query));
  }

  createEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTable: EdgeSchema,
    attributes?: Record<string, InputChangeResult<any>>
  ) {
    const query = createEdgeQuery(node1, node2, edgeTable, attributes);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  deleteEdge(node1: GraphNode, node2: GraphNode, edgeTableName: string) {
    const query = deleteEdgeQuery(node1, node2, edgeTableName);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  updateEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
    values: Record<string, InputChangeResult<any>>
  ) {
    const query = updateEdgeQuery(node1, node2, edgeTableName, values);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  getAllSchemaProperties() {
    const { nodeTables, edgeTables } = this.snapshotGraphState();
    return { nodeTables, edgeTables };
  }

  getSingleSchemaProperties(tableName: string) {
    const { nodeTables, edgeTables } = this.getAllSchemaProperties();
    const tables = { ...nodeTables, ...edgeTables };
    return tables.find((t) => t.tableName === tableName) ?? null;
  }
}

import { snapshotGraphState } from "./KuzuQueryExecutor";

import {
  queryResultColorMapExtraction,
  processQueryResult,
} from "./KuzuQueryResultExtractor";

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

import type { CompositeType } from "~/kuzu/types/KuzuDBTypes";
import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { InputChangeResult } from "~/features/visualizer/inputs";
import type {
  ErrorQueryResult,
  SuccessQueryResult,
} from "./KuzuQueryResultExtractor.types";
import type Connection from "../types/kuzu_wasm_internal/connection";
import { throwOnFailedQuery } from "./KuzuBaseService.util";

export default abstract class KuzuBaseService {
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

  /**
   * Get the virtual file system for the current Kuzu implementation
   * Must be implemented by subclasses
   * @returns File system object with mkdir, writeFile, unlink methods
   */
  protected abstract getFileSystem(): any;

  snapshotGraphState() {
    return snapshotGraphState(this.connection);
  }

  /**
   * Get column types from a query without processing full results
   * Useful for type inference from LOAD queries
   * @param {string} query - The Cypher query to execute
   * @returns {Array<string>} - Array of column type strings
   */
  getColumnTypes(query: string): string[] {
    if (!this.connection || !query.trim()) {
      throw new Error("Connection not initialized or empty query");
    }

    const result = this.connection.query(query);
    const columnTypes = result.getColumnTypes();
    result.close();
    
    return columnTypes;
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

  /**
   * Import graph data from CSV files
   * Throws error on failure - frontend will handle error catching
   * @param nodesText - Content of the nodes CSV file
   * @param edgesText - Content of the edges CSV file
   * @param nodeTableName - Name for the node table
   * @param edgeTableName - Name for the edge table
   * @param isDirected - Whether the graph is directed
   * @returns Import result with success status and graph state
   * @throws Error if import fails at any step
   */
  async importFromCSV(
    nodesText: string,
    edgesText: string,
    nodeTableName: string,
    edgeTableName: string,
    isDirected: boolean
  ) {
    if (!this.connection) {
      throw new Error("Kuzu service not initialized");
    }

    console.log(`[CSV Import] Starting import for tables: ${nodeTableName}, ${edgeTableName}`);

    // Parse CSV to get structure
    const nodesLines = nodesText.trim().split("\n");
    const edgesLines = edgesText.trim().split("\n");

    // Parse node CSV header to get all columns
    const nodesHeader = nodesLines[0].trim();
    const nodeColumns = nodesHeader.split(",").map(col => col.trim());

    // Parse edge CSV header
    const edgesHeader = edgesLines[0].trim();
    const edgeColumns = edgesHeader.split(",").map(col => col.trim());
    const hasWeight = edgeColumns.includes("weight");

    // Get filesystem access from subclass implementation
    const fs = this.getFileSystem();
    const tempDir = '/tmp';

    // Ensure temp directory exists
    try {
      fs.mkdir(tempDir);
    } catch (e) {
      // Directory might already exist, ignore error
    }

    const nodesPath = `${tempDir}/nodes_${Date.now()}.csv`;
    const edgesPath = `${tempDir}/edges_${Date.now()}.csv`;

    // Write files to virtual file system
    fs.writeFile(nodesPath, nodesText);
    fs.writeFile(edgesPath, edgesText);

    // Infer column types by using LOAD FROM to scan the CSV
    const primaryKeyColumn = nodeColumns[0];
    
    console.log(`[CSV Import] Primary key: ${primaryKeyColumn}`);
    console.log(`[CSV Import] Inferring types for columns:`, nodeColumns);

    // Query to infer types - load one row and return it to see inferred types
    const typeInferenceQuery = `
      LOAD FROM '${nodesPath}' (header = true)
      RETURN ${nodeColumns.join(', ')}
      LIMIT 1
    `;

    console.log(`[CSV Import] Inferring types with query: ${typeInferenceQuery}`);
    
    // Use the getColumnTypes method to infer types
    const columnTypes = this.getColumnTypes(typeInferenceQuery);
    
    // Extract column types from the query result
    const inferredTypes: Record<string, PrimaryKeyType | NonPrimaryKeyType> = {};
    
    columnTypes.forEach((kuzuType: string, index: number) => {
      const colName = nodeColumns[index];
      // Map Kuzu types to schema types
      let schemaType: PrimaryKeyType | NonPrimaryKeyType = "STRING";
      
      const typeUpper = kuzuType.toUpperCase();
      if (typeUpper.includes("INT32")) {
        schemaType = "INT32";
      } else if (typeUpper.includes("INT16")) {
        schemaType = "INT16";
      } else if (typeUpper.includes("INT8")) {
        schemaType = "INT8";
      } else if (typeUpper.includes("INT64") || typeUpper.includes("INT")) {
        // Map INT64 and generic INT to INT32 (closest available type)
        schemaType = "INT32";
      } else if (typeUpper.includes("DOUBLE")) {
        schemaType = "DOUBLE";
      } else if (typeUpper.includes("FLOAT")) {
        schemaType = "FLOAT";
      } else if (typeUpper.includes("BOOL")) {
        schemaType = "BOOL";
      } else if (typeUpper.includes("DATE")) {
        schemaType = "DATE";
      }
      
      inferredTypes[colName] = schemaType;
    });

    console.log(`[CSV Import] Inferred types:`, inferredTypes);

    // Create node table schema with inferred types
    const primaryKeyType = inferredTypes[primaryKeyColumn] as PrimaryKeyType;
    const additionalProperties = nodeColumns.slice(1).map(col => ({
      name: col,
      type: (inferredTypes[col] || "STRING") as NonPrimaryKeyType
    }));

    console.log(`[CSV Import] Creating node table with primary key: ${primaryKeyColumn} (${primaryKeyType})`);
    console.log(`[CSV Import] Additional properties:`, additionalProperties);

    await this.createNodeSchema(
      nodeTableName,
      primaryKeyColumn,
      primaryKeyType,
      additionalProperties
    );

    // Load nodes using COPY FROM for direct bulk loading
    const copyNodesQuery = `COPY ${nodeTableName} FROM '${nodesPath}' (header = true)`;

    console.log(`[CSV Import] Loading nodes with COPY FROM: ${copyNodesQuery}`);
    await this.executeQuery(copyNodesQuery);

    // Create edge table schema using CREATE REL TABLE syntax
    const edgeTableQuery = hasWeight
      ? `CREATE REL TABLE ${edgeTableName} (
          FROM ${nodeTableName} TO ${nodeTableName},
          weight DOUBLE
        )`
      : `CREATE REL TABLE ${edgeTableName} (
          FROM ${nodeTableName} TO ${nodeTableName}
        )`;

    console.log(`[CSV Import] Creating edge table with query: ${edgeTableQuery}`);
    await this.executeQuery(edgeTableQuery);

    // Load edges using COPY FROM for direct table loading
    if (isDirected) {
      // For directed graphs, use COPY FROM directly
      const copyEdgesQuery = `COPY ${edgeTableName} FROM '${edgesPath}' (header = true)`;

      console.log(`[CSV Import] Loading directed edges with COPY FROM: ${copyEdgesQuery}`);
      await this.executeQuery(copyEdgesQuery);
    } else {
      // For undirected graphs, we need to create edges in both directions
      // First, copy the original edges
      const copyEdgesQuery1 = `COPY ${edgeTableName} FROM '${edgesPath}' (header = true)`;

      console.log(`[CSV Import] Loading undirected edges (direction 1) with COPY FROM: ${copyEdgesQuery1}`);
      await this.executeQuery(copyEdgesQuery1);

      // Then create a temporary file with reversed edges for the second direction
      const reversedEdgesPath = `${tempDir}/reversed_edges_${Date.now()}.csv`;
      const reversedEdgesContent = edgesLines.map((line, index) => {
        if (index === 0) {
          // Header line - keep as is
          return line;
        }
        // Data lines - swap first two columns (source and target)
        const parts = line.split(',');
        if (parts.length >= 2) {
          [parts[0], parts[1]] = [parts[1], parts[0]]; // Swap source and target
        }
        return parts.join(',');
      }).join('\n');

      fs.writeFile(reversedEdgesPath, reversedEdgesContent);

      // Copy the reversed edges
      const copyEdgesQuery2 = `COPY ${edgeTableName} FROM '${reversedEdgesPath}' (header = true)`;

      console.log(`[CSV Import] Loading undirected edges (direction 2) with COPY FROM: ${copyEdgesQuery2}`);
      await this.executeQuery(copyEdgesQuery2);

      // Clean up the temporary reversed edges file
      try {
        fs.unlink(reversedEdgesPath);
      } catch (e) {
        console.warn(`[CSV Import] Failed to clean up reversed edges file:`, e);
      }
    }

    // Clean up temporary files
    try {
      fs.unlink(nodesPath);
      fs.unlink(edgesPath);
    } catch (e) {
      console.warn(`[CSV Import] Failed to clean up temporary files:`, e);
    }

    // Refresh graph state
    const graphState = await this.snapshotGraphState();

    console.log(`[CSV Import] Successfully bulk-imported graph with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges`);

    return {
      success: true,
      message: `Successfully imported graph with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges!`,
      data: graphState,
    };
  }
}

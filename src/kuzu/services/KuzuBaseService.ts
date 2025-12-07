// @ts-ignore
import kuzu from "kuzu-wasm/sync";

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
import {
  snapshotGraphState,
  validateSchemaPreflight,
} from "../helpers/KuzuQueryExecutor";
import type Database from "../types/kuzu_wasm_internal/database";

import { throwOnFailedQuery } from "./KuzuBaseService.util";

import type { CompositeType } from "~/kuzu/types/KuzuDBTypes";
import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
import type { InputChangeResult } from "~/features/visualizer/inputs";
import type { ColorMap } from "~/igraph/types";
import {
  NON_PK_SCHEMA_TYPES,
  PK_SCHEMA_TYPES,
} from "~/features/visualizer/schema-inputs";

type MaybePromise<T> = T | Promise<T>;

const isPromiseLike = <T>(value: MaybePromise<T>): value is Promise<T> =>
  Boolean(value) && typeof (value as any).then === "function";

type SyncFileSystem = ReturnType<kuzu.getFS>;
type AsyncFileSystem = null;

type VirtualFileCapableService = {
  writeVirtualFile(path: string, content: string): Promise<void> | void;
  deleteVirtualFile(path: string): Promise<void> | void;
};

const isVirtualCapableService = (
  service: unknown
): service is VirtualFileCapableService =>
  Boolean(
    service &&
      typeof (service as VirtualFileCapableService).writeVirtualFile ===
        "function" &&
      typeof (service as VirtualFileCapableService).deleteVirtualFile ===
        "function"
  );

type InitializedKuzuBaseService = KuzuBaseService & {
  db: NonNullable<KuzuBaseService["db"]>;
  connection: NonNullable<KuzuBaseService["connection"]>;
  initialized: true;
};

export default abstract class KuzuBaseService {
  protected db: Database | null = null;
  protected connection: Connection | null = null;
  protected initialized: boolean = false;

  constructor() {
    this.db = null;
    this.connection = null;
    this.initialized = false;
  }

  /**
   * Get the virtual file system for the current Kuzu implementation
   * Must be implemented by subclasses
   * @returns File system object with mkdir, writeFile, unlink methods
   */
  protected abstract getFileSystem(): SyncFileSystem | AsyncFileSystem;

  /**
   * Canonicalize node order for undirected edges to ensure a single stored direction.
   * For cross-table edges: sort by table name (lexicographically).
   * For same-table edges: sort by primary key string value.
   * For directed graphs: preserve the original order.
   */
  protected canonicalizeNodesForEdge(
    node1: GraphNode,
    node2: GraphNode,
    isDirected: boolean
  ): { src: GraphNode; dst: GraphNode } {
    if (isDirected) {
      return { src: node1, dst: node2 };
    }

    // Cross-table: canonical order by tableName
    if (node1.tableName !== node2.tableName) {
      const [first, second] = [node1, node2].sort((a, b) =>
        a.tableName.localeCompare(b.tableName)
      );
      return { src: first, dst: second };
    }

    // Same-table: canonical order by primary key string representation
    const pk1 = String(node1._primaryKeyValue);
    const pk2 = String(node2._primaryKeyValue);

    if (pk1 <= pk2) {
      return { src: node1, dst: node2 };
    }

    return { src: node2, dst: node1 };
  }

  snapshotGraphState() {
    if (!this.connection) {
      return {
        nodes: [],
        edges: [],
        nodeTables: [],
        edgeTables: [],
      };
    }
    return snapshotGraphState(this.connection);
  }

  /**
   * Get column types from a query without processing full results
   * Useful for type inference from LOAD queries
   * @param {string} query - The Cypher query to execute
   * @returns {Array<string>} - Array of column type strings
   */
  getColumnTypes(query: string): string[] | Promise<string[]> {
    this.checkInitialization();

    if (!query.trim()) {
      throw new Error("Query cannot be empty. Please enter a query first.");
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
  executeQuery(query: string): any {
    this.checkInitialization();

    if (!query.trim()) {
      throw new Error("Query cannot be empty. Please enter a query first.");
    }

    // Init variable
    const successQueries: SuccessQueryResult[] = [];
    const failedQueries: ErrorQueryResult[] = [];
    let allSuccess = true;
    let colorMap: ColorMap = {};
    let resultType = "graph";

    const preflightResult = validateSchemaPreflight(this.connection, query);
    if (preflightResult != null && !preflightResult.success) {
      return preflightResult;
    }

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
    primaryKeyType: string,
    properties: {
      name: string;
      type: string;
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

  async createNode(
    tableName: string,
    properties: Record<
      string,
      { value: any; success?: boolean; message?: string }
    >
  ) {
    // Convert File objects to Uint8Array for BLOB fields
    const processedProperties: typeof properties = {};
    for (const [key, obj] of Object.entries(properties)) {
      if (obj.value instanceof File) {
        const arrayBuffer = await obj.value.arrayBuffer();
        processedProperties[key] = {
          ...obj,
          value: new Uint8Array(arrayBuffer),
        };
      } else {
        processedProperties[key] = obj;
      }
    }

    const query = createNodeQuery(tableName, processedProperties);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  async updateNode(
    node: GraphNode,
    values: Record<string, InputChangeResult<any>>
  ) {
    // Convert File objects to Uint8Array for BLOB fields
    const processedValues: typeof values = {};
    for (const [key, obj] of Object.entries(values)) {
      if (obj.value instanceof File) {
        const arrayBuffer = await obj.value.arrayBuffer();
        processedValues[key] = {
          ...obj,
          value: new Uint8Array(arrayBuffer),
        };
      } else {
        processedValues[key] = obj;
      }
    }

    const query = updateNodeQuery(node, processedValues);
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
    properties: { name: string; type: string }[],
    isDirected: boolean,
    relationshipType?: "MANY_ONE" | "ONE_MANY" | "MANY_MANY" | "ONE_ONE"
  ) {
    const query = createEdgeSchemaQuery(
      tableName,
      tablePairs,
      properties,
      isDirected,
      relationshipType
    );
    return throwOnFailedQuery(this.executeQuery(query));
  }

  async createEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTable: EdgeSchema,
    isDirected: boolean,
    attributes?: Record<string, InputChangeResult<any>>
  ) {
    // Convert File objects to Uint8Array for BLOB fields in attributes
    let processedAttributes = attributes;
    if (attributes) {
      processedAttributes = {};
      for (const [key, obj] of Object.entries(attributes)) {
        if (obj.value instanceof File) {
          const arrayBuffer = await obj.value.arrayBuffer();
          processedAttributes[key] = {
            ...obj,
            value: new Uint8Array(arrayBuffer),
          };
        } else {
          processedAttributes[key] = obj;
        }
      }
    }

    const { src, dst } = this.canonicalizeNodesForEdge(
      node1,
      node2,
      isDirected
    );

    const query = createEdgeQuery(src, dst, edgeTable, isDirected, processedAttributes);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  deleteEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
    isDirected: boolean
  ) {
    const { src, dst } = this.canonicalizeNodesForEdge(
      node1,
      node2,
      isDirected
    );
    const query = deleteEdgeQuery(src, dst, edgeTableName, isDirected);
    return throwOnFailedQuery(this.executeQuery(query));
  }

  async updateEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
    values: Record<string, InputChangeResult<any>>,
    isDirected: boolean
  ) {
    // Convert File objects to Uint8Array for BLOB fields
    const processedValues: typeof values = {};
    for (const [key, obj] of Object.entries(values)) {
      if (obj.value instanceof File) {
        const arrayBuffer = await obj.value.arrayBuffer();
        processedValues[key] = {
          ...obj,
          value: new Uint8Array(arrayBuffer),
        };
      } else {
        processedValues[key] = obj;
      }
    }

    const { src, dst } = this.canonicalizeNodesForEdge(
      node1,
      node2,
      isDirected
    );

    const query = updateEdgeQuery(
      src,
      dst,
      edgeTableName,
      processedValues,
      isDirected
    );
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
    databaseName: string,
    nodesText: string,
    edgesText: string,
    nodeTableName: string,
    edgeTableName: string,
    isDirected: boolean = true
  ) {
    this.checkInitialization();

    console.log(
      `[CSV Import] Starting import for tables: ${nodeTableName}, ${edgeTableName}`
    );

    // Parse CSV to get structure
    const nodesLines = nodesText.trim().split("\n");
    const edgesLines = edgesText.trim().split("\n");

    // Parse node CSV header to get all columns
    const nodesHeader = nodesLines[0].trim();
    const nodeColumns = nodesHeader.split(",").map((col) => col.trim());

    // Parse edge CSV header
    const edgesHeader = edgesLines[0].trim();
    const edgeColumns = edgesHeader.split(",").map((col) => col.trim());

    const virtualFS = isVirtualCapableService(this) ? this : null;
    const fs = virtualFS ? null : this.getFileSystem();
    const tempDir = "/tmp";

    if (fs) {
      try {
        fs.mkdir(tempDir);
      } catch (e) {
        // Directory might already exist, ignore error
      }
    }

    const nodesPath = `${tempDir}/nodes_${Date.now()}.csv`;
    const edgesPath = `${tempDir}/edges_${Date.now()}.csv`;

    const writeFile = async (path: string, content: string) => {
      if (virtualFS) {
        await virtualFS.writeVirtualFile(path, content);
        return;
      }
      fs!.writeFile(path, content);
    };

    const deleteFile = async (path: string, warnPrefix = "[CSV Import]") => {
      try {
        if (virtualFS) {
          await virtualFS.deleteVirtualFile(path);
        } else {
          fs!.unlink(path);
        }
      } catch (error) {
        console.warn(`${warnPrefix} Failed to clean up file ${path}:`, error);
      }
    };

    // Write node file to virtual file system as-is
    await writeFile(nodesPath, nodesText);

    // For edges, pre-canonicalize (source, target) for undirected graphs to avoid duplicates
    let edgesContentToWrite = edgesText;
    if (!isDirected) {
      const [headerLine, ...dataLines] = edgesLines;
      const headerCols = headerLine.split(",").map((c) => c.trim());
      const sourceIdx = headerCols.indexOf("source");
      const targetIdx = headerCols.indexOf("target");

      if (sourceIdx === -1 || targetIdx === -1) {
        throw new Error(
          "[CSV Import] Edges CSV header must contain 'source' and 'target' columns for undirected graphs"
        );
      }

      const seenPairs = new Set<string>();
      const canonicalDataLines = dataLines
        .map((line) => {
          const parts = line.split(",");
          if (parts.length <= Math.max(sourceIdx, targetIdx)) {
            return null;
          }
          const rawSource = parts[sourceIdx];
          const rawTarget = parts[targetIdx];

          const s = rawSource.trim();
          const t = rawTarget.trim();

          const [canonSource, canonTarget] =
            s <= t ? [rawSource, rawTarget] : [rawTarget, rawSource];

          parts[sourceIdx] = canonSource;
          parts[targetIdx] = canonTarget;

          const key = `${canonSource}::${canonTarget}`;
          if (seenPairs.has(key)) {
            return null;
          }
          seenPairs.add(key);
          return parts.join(",");
        })
        .filter((line): line is string => line !== null);

      edgesContentToWrite = [headerLine, ...canonicalDataLines].join("\n");
    }

    await writeFile(edgesPath, edgesContentToWrite);

    try {
      // Infer column types by using LOAD FROM to scan the CSV
      const primaryKeyColumn = nodeColumns[0];

      console.log(`[CSV Import] Primary key: ${primaryKeyColumn}`);
      console.log(`[CSV Import] Inferring types for columns:`, nodeColumns);

      // Query to infer types - load one row and return it to see inferred types
      const typeInferenceQuery = `
          LOAD FROM '${nodesPath}' (header = true)
          RETURN ${nodeColumns.join(", ")}
          LIMIT 1
        `;

      console.log(
        `[CSV Import] Inferring types with query: ${typeInferenceQuery}`
      );

      // Use the getColumnTypes method to infer types
      const columnTypesResult = this.getColumnTypes(typeInferenceQuery);
      const columnTypes = isPromiseLike(columnTypesResult)
        ? await columnTypesResult
        : columnTypesResult;

      // Extract column types from the query result
      const inferredTypes: Record<string, string> = {};
      const supportedTypes: string[] = [
        ...PK_SCHEMA_TYPES,
        ...NON_PK_SCHEMA_TYPES,
      ].map((t) => t.toString());
      columnTypes.forEach((kuzuType: string, index: number) => {
        const colName = nodeColumns[index];
        // Map Kuzu types to schema types
        let schemaType: string = "STRING";

        const typeUpper = kuzuType.toUpperCase();
        if (supportedTypes.includes(typeUpper)) {
          schemaType = typeUpper;
        } else if (typeUpper.startsWith("INT")) {
          // Try scale down INT64/INT128 to INT32 if possible
          // Error with value will be caught during COPY if not possible
          schemaType = "INT32";
        } else if (typeUpper.startsWith("UINT")) {
          // Try scale down UINT64/UINT128 to UINT32 if possible
          // Error with value will be caught during COPY if not possible
          schemaType = "UINT32";
        }

        inferredTypes[colName] = schemaType;
      });

      // Create node table schema with inferred types
      const primaryKeyType = inferredTypes[primaryKeyColumn];
      const additionalProperties = nodeColumns.slice(1).map((col) => ({
        name: col,
        type: inferredTypes[col] ?? "STRING",
      }));

      console.log(
        `[CSV Import] Creating node table with primary key: ${primaryKeyColumn} (${primaryKeyType})`
      );
      console.log(`[CSV Import] Additional properties:`, additionalProperties);

      await this.createNodeSchema(
        nodeTableName,
        primaryKeyColumn,
        primaryKeyType,
        additionalProperties
      );

      // Load nodes using COPY FROM for direct bulk loading
      const copyNodesQuery = `COPY ${nodeTableName} FROM '${nodesPath}' (header = true)`;

      console.log(
        `[CSV Import] Loading nodes with COPY FROM: ${copyNodesQuery}`
      );
      throwOnFailedQuery(await this.executeQuery(copyNodesQuery));

      // Create edge table schema using CREATE REL TABLE syntax
      const edgeAttributeColumns = edgeColumns.filter(
        (col) => col !== "source" && col !== "target"
      );

      const edgeTypeInferenceQuery = `
        LOAD FROM '${edgesPath}' (header = true)
        RETURN ${edgeAttributeColumns.join(", ")}
        LIMIT 1
      `;

      console.log(
        `[CSV Import] Inferring edge attribute types with query: ${edgeTypeInferenceQuery}`
      );

      const edgeColumnTypesResult = this.getColumnTypes(edgeTypeInferenceQuery);
      const edgeColumnTypes = isPromiseLike(edgeColumnTypesResult)
        ? await edgeColumnTypesResult
        : edgeColumnTypesResult;

      const inferredEdgeTypes: Record<string, string> = {};
      edgeColumnTypes.forEach((kuzuType: string, index: number) => {
        const colName = edgeAttributeColumns[index];
        let schemaType: string = "STRING";

        const typeUpper = kuzuType.toUpperCase();
        if (supportedTypes.includes(typeUpper)) {
          schemaType = typeUpper;
        } else if (typeUpper.startsWith("INT")) {
          schemaType = "INT32";
        } else if (typeUpper.startsWith("UINT")) {
          schemaType = "UINT32";
        }

        inferredEdgeTypes[colName] = schemaType;
      });

      const edgeProperties = edgeAttributeColumns.map((col) => ({
        name: col,
        type: inferredEdgeTypes[col] ?? "STRING",
      }));

      console.log(
        `[CSV Import] Creating edge table with source and target from ${nodeTableName}`
      );
      console.log(`[CSV Import] Additional properties:`, edgeProperties);

      // Create edge table schema using CREATE REL TABLE syntax
      const edgePropsSchema = edgeProperties
        .map((prop) => `${prop.name} ${prop.type}`)
        .join(", ");

      const edgeTableQuery = `
        CREATE REL TABLE ${edgeTableName} (
          FROM ${nodeTableName} TO ${nodeTableName}
          ${edgeProperties.length > 0 ? `, ${edgePropsSchema}` : ""}
        )
      `;

      console.log(
        `[CSV Import] Creating edge table with query: ${edgeTableQuery}`
      );
      throwOnFailedQuery(await this.executeQuery(edgeTableQuery));

      // Load edges using COPY FROM for direct table loading
        const copyEdgesQuery = `COPY ${edgeTableName} FROM '${edgesPath}' (header = true)`;

        console.log(
        `[CSV Import] Loading edges with COPY FROM (isDirected=${isDirected}): ${copyEdgesQuery}`
        );
        throwOnFailedQuery(await this.executeQuery(copyEdgesQuery));

      const graphState = await this.snapshotGraphState();

      console.log(
        `[CSV Import] Successfully bulk-imported graph with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges`
      );

      return { databaseName, ...graphState };
    } finally {
      // Clean up temporary files
      await deleteFile(nodesPath);
      await deleteFile(edgesPath);
    }
  }

  /**
   * Import graph data from JSON files
   * Throws error on failure - frontend will handle error catching
   * @param nodesText - Content of the nodes JSON file
   * @param edgesText - Content of the edges JSON file
   * @param nodeTableName - Name for the node table
   * @param edgeTableName - Name for the edge table
   * @param isDirected - Whether the graph is directed
   * @returns Import result with success status and graph state
   * @throws Error if import fails at any step
   */
  async importFromJSON(
    databaseName: string,
    nodesText: string,
    edgesText: string,
    nodeTableName: string,
    edgeTableName: string,
    isDirected: boolean = true
  ) {
    this.checkInitialization();

    console.log(
      `[JSON Import] Starting import for tables: ${nodeTableName}, ${edgeTableName}`
    );

    // Parse JSON content
    const nodesData = JSON.parse(nodesText);
    const edgesData = JSON.parse(edgesText);

    if (!Array.isArray(nodesData) || nodesData.length === 0) {
      throw new Error("Nodes JSON must contain at least one object");
    }

    if (!Array.isArray(edgesData) || edgesData.length === 0) {
      throw new Error("Edges JSON must contain at least one object");
    }

    const firstNode = nodesData[0];
    if (typeof firstNode !== "object" || firstNode === null) {
      throw new Error("Node entries must be JSON objects");
    }

    const nodeKeys = Object.keys(firstNode);
    if (nodeKeys.length === 0) {
      throw new Error("Node objects must have at least one property");
    }

    const primaryKeyColumn = nodeKeys[0];

    const firstEdge = edgesData[0];
    if (
      typeof firstEdge !== "object" ||
      firstEdge === null ||
      !("from" in firstEdge) ||
      !("to" in firstEdge)
    ) {
      throw new Error("Edge objects must contain 'from' and 'to' properties");
    }

    const edgeProperties = Object.keys(firstEdge).filter(
      (key) => key !== "from" && key !== "to"
    );

    const virtualFS = isVirtualCapableService(this) ? this : null;
    const fs = virtualFS ? null : this.getFileSystem();
    const tempDir = "/tmp";

    if (fs) {
      try {
        fs.mkdir(tempDir);
      } catch (e) {
        // Directory might already exist, ignore error
      }
    }

    const timestamp = Date.now();
    const nodesPath = `${tempDir}/nodes_${timestamp}.json`;
    const edgesPath = `${tempDir}/edges_${timestamp}.json`;

    const writeFile = async (path: string, content: string) => {
      if (virtualFS) {
        await virtualFS.writeVirtualFile(path, content);
        return;
      }
      fs!.writeFile(path, content);
    };

    const deleteFile = async (path: string, warnPrefix = "[JSON Import]") => {
      try {
        if (virtualFS) {
          await virtualFS.deleteVirtualFile(path);
        } else {
          fs!.unlink(path);
        }
      } catch (error) {
        console.warn(`${warnPrefix} Failed to clean up file ${path}:`, error);
      }
    };

    await writeFile(nodesPath, nodesText);

    // For edges, pre-canonicalize (from, to) for undirected graphs to avoid duplicates
    let edgesContentToWrite = edgesText;
    if (!isDirected) {
      const edgesArray = JSON.parse(edgesText);
      if (!Array.isArray(edgesArray)) {
        throw new Error("Edges JSON must contain an array of objects");
      }

      const seenPairs = new Set<string>();
      const canonicalEdges = edgesArray
        .map((edge: unknown): { from: string; to: string } & Record<string, unknown> | null => {
          if (
            typeof edge !== "object" ||
            edge === null ||
            !("from" in edge) ||
            !("to" in edge)
          ) {
            return null;
          }

          const from = String((edge as any)["from"]);
          const to = String((edge as any)["to"]);

          const [canonFrom, canonTo] =
            from <= to ? [from, to] : [to, from];

          const key = `${canonFrom}::${canonTo}`;
          if (seenPairs.has(key)) {
            return null;
          }
          seenPairs.add(key);

          const extraProps = Object.fromEntries(
            Object.entries(edge as Record<string, unknown>).filter(
              ([key]) => key !== "from" && key !== "to"
            )
          );

          return {
            from: canonFrom,
            to: canonTo,
            ...extraProps,
          };
        })
        .filter(
          (
            edge
          ): edge is { from: string; to: string } & Record<string, unknown> =>
            edge !== null
        );

      edgesContentToWrite = JSON.stringify(canonicalEdges);
    }

    await writeFile(edgesPath, edgesContentToWrite);

    try {
      // Install and load JSON extension (safe to retry)
      try {
        throwOnFailedQuery(await this.executeQuery("INSTALL json"));
        throwOnFailedQuery(await this.executeQuery("LOAD EXTENSION json"));
      } catch (error) {
        console.log("[JSON Import] JSON extension load/install notice:", error);
      }

      // Infer column types by scanning JSON
      const typeInferenceQuery = `
          LOAD FROM '${nodesPath}'
          RETURN ${nodeKeys.join(", ")}
          LIMIT 1
        `;

      const columnTypesResult = this.getColumnTypes(typeInferenceQuery);
      const columnTypes = isPromiseLike(columnTypesResult)
        ? await columnTypesResult
        : columnTypesResult;

      const inferredTypes: Record<string, string> = {};
      const supportedTypes: string[] = [
        ...PK_SCHEMA_TYPES,
        ...NON_PK_SCHEMA_TYPES,
      ].map((t) => t.toString());
      columnTypes.forEach((kuzuType: string, index: number) => {
        const colName = nodeKeys[index];
        // Map Kuzu types to schema types
        let schemaType: string = "STRING";

        const typeUpper = kuzuType.toUpperCase();
        if (supportedTypes.includes(typeUpper)) {
          schemaType = typeUpper;
        } else if (typeUpper.startsWith("INT")) {
          // Try scale down INT64/INT128 to INT32 if possible
          // Error with value will be caught during COPY if not possible
          schemaType = "INT32";
        } else if (typeUpper.startsWith("UINT")) {
          // Try scale down UINT64/UINT128 to UINT32 if possible
          // Error with value will be caught during COPY if not possible
          schemaType = "UINT32";
        }

        inferredTypes[colName] = schemaType;
      });

      console.log("[JSON Import] Inferred column types:", inferredTypes);

      const propertyDefinitions = nodeKeys
        .map((col) => `${col} ${inferredTypes[col] ?? "STRING"}`)
        .join(", ");

      const createNodeTableQuery = `
          CREATE NODE TABLE ${nodeTableName} (
            ${propertyDefinitions},
            PRIMARY KEY(${primaryKeyColumn})
          )
        `;

      throwOnFailedQuery(await this.executeQuery(createNodeTableQuery));

      const copyNodesQuery = `COPY ${nodeTableName} FROM '${nodesPath}'`;
      throwOnFailedQuery(await this.executeQuery(copyNodesQuery));

      const edgeTypeInferenceQuery = `
      LOAD FROM '${edgesPath}'
      RETURN ${edgeProperties.join(", ")}
      LIMIT 1
    `;

      console.log(
        `[JSON Import] Inferring edge attribute types with query: ${edgeTypeInferenceQuery}`
      );

      const edgeColumnTypesResult = this.getColumnTypes(edgeTypeInferenceQuery);
      const edgeColumnTypes = isPromiseLike(edgeColumnTypesResult)
        ? await edgeColumnTypesResult
        : edgeColumnTypesResult;

      const inferredEdgeTypes: Record<string, string> = {};

      edgeColumnTypes.forEach((kuzuType: string, index: number) => {
        const colName = edgeProperties[index];
        let schemaType: string = "STRING";

        const typeUpper = kuzuType.toUpperCase();
        if (supportedTypes.includes(typeUpper)) {
          schemaType = typeUpper;
        } else if (typeUpper.startsWith("INT")) {
          schemaType = "INT32";
        } else if (typeUpper.startsWith("UINT")) {
          schemaType = "UINT32";
        }

        inferredEdgeTypes[colName] = schemaType;
      });

      const edgePropertiesWithTypes = edgeProperties.map((prop) => ({
        name: prop,
        type: inferredEdgeTypes[prop] ?? "STRING",
      }));

      console.log(
        "[JSON Import] Inferred edge attribute types:",
        edgePropertiesWithTypes
      );

      const edgePropsDefinition = edgePropertiesWithTypes
        .map((prop) => `${prop.name} ${prop.type}`)
        .join(", ");

      const edgeTableQuery = `
        CREATE REL TABLE ${edgeTableName} (
          FROM ${nodeTableName} TO ${nodeTableName}
          ${edgePropertiesWithTypes.length > 0 ? `, ${edgePropsDefinition}` : ""}
        )
      `;

      throwOnFailedQuery(await this.executeQuery(edgeTableQuery));

        const copyEdgesQuery = `COPY ${edgeTableName} FROM '${edgesPath}'`;
        throwOnFailedQuery(await this.executeQuery(copyEdgesQuery));

      const graphState = await this.snapshotGraphState();

      console.log(
        `[JSON Import] Successfully imported graph with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges`
      );

      return { databaseName, ...graphState };
    } finally {
      await deleteFile(nodesPath);
      await deleteFile(edgesPath);
    }
  }

  protected checkInitialization(): asserts this is InitializedKuzuBaseService {
    if (!this.connection || !this.db) {
      throw new Error("Connection or database is not initialized");
    }
  }
}

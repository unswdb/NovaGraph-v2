import KuzuInMemorySync from "../services/KuzuInMemorySync";
import KuzuInMemoryAsync from "../services/KuzuInMemoryAsync";
// @ts-ignore - KuzuPersistentSync is a JS file
import KuzuPersistentSync from "../services/KuzuPersistentSync";
import KuzuPersistentAsync from "../services/KuzuPersistentAsync";

import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
import type { CompositeType } from "~/kuzu/types/KuzuDBTypes";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { InputChangeResult } from "~/features/visualizer/inputs";

/**
 * Initialization options for Kuzu database
 */
interface KuzuInitOptions {
  /** Path/name for persistent database */
  dbPath?: string;
  /** Database configuration options */
  dbOptions?: Record<string, any>;
}

/**
 * Standard result type for database operations
 */
export interface KuzuDatabaseResult {
  success: boolean;
  message?: string;
  error?: string;
  database?: any;
}

/**
 * Type guard for persistent services (duck typing approach)
 */
function isPersistentService(
  service: KuzuInMemorySync | KuzuInMemoryAsync | KuzuPersistentSync | KuzuPersistentAsync | null
): service is KuzuPersistentSync | KuzuPersistentAsync {
  if (!service) return false;
  // Duck typing: check if service has persistent-specific methods
  return (
    typeof (service as any).connectToDatabase === 'function' &&
    typeof (service as any).createDatabase === 'function' &&
    typeof (service as any).deleteDatabase === 'function' &&
    typeof (service as any).listDatabases === 'function' &&
    typeof (service as any).saveIDBFS === 'function' &&
    typeof (service as any).loadIDBFS === 'function' &&
    typeof (service as any).getCurrentDatabaseName === 'function'
  );
}

type VirtualFileCapableService = {
  writeVirtualFile(path: string, content: string): Promise<void> | void;
  deleteVirtualFile(path: string): Promise<void> | void;
};

const hasVirtualFileSupport = (
  service: KuzuInMemorySync | KuzuInMemoryAsync | KuzuPersistentSync | KuzuPersistentAsync | null
): service is VirtualFileCapableService =>
  Boolean(
    service &&
      typeof (service as any).writeVirtualFile === "function" &&
      typeof (service as any).deleteVirtualFile === "function"
  );

const isPromise = <T>(value: any): value is Promise<T> =>
  Boolean(value) && typeof value.then === "function";

/**
 * Normalize and validate type parameter
 */
function normalizeType(type: string): 'inmemory' | 'persistent' {
  const normalized = type.toLowerCase().trim();
  if (normalized !== 'inmemory' && normalized !== 'persistent') {
    throw new Error(`Invalid Kuzu type '${type}'. Must be 'inmemory' or 'persistent'`);
  }
  return normalized;
}

/**
 * Normalize and validate mode parameter
 */
function normalizeMode(mode: string): 'sync' | 'async' {
  const normalized = mode.toLowerCase().trim();
  if (normalized !== 'sync' && normalized !== 'async') {
    throw new Error(`Invalid Kuzu mode '${mode}'. Must be 'sync' or 'async'`);
  }
  return normalized;
}

/**
 * This class is used to handle logic related to Kuzu before exposing into the highest API
 */
class KuzuController {
  // Store current Kuzu type, i.e InMemorySync, InMemoryAsync, PersistentSync, PersistentAsync
  private _service: KuzuInMemorySync | KuzuInMemoryAsync | KuzuPersistentSync | KuzuPersistentAsync | null = null;
  constructor() {
    this._service = null;
  }

  // -- General function for all types of Kuzu db --
  /**
   * Initialize Kuzu with specified type and mode
   *
   * @param type - Either `"inmemory"` or `"persistent"` (case-insensitive).
   * @param mode - Either `"sync"` or `"async"` (case-insensitive).
   * @param options - Additional initialization options.
   * @param options.dbPath - Path/name for persistent database.
   * @param options.dbOptions - Database configuration options.
   *
   * @returns The initialized service.
   */
  async initialize(type: string, mode: string, options: KuzuInitOptions = {}) {
    if (this._service) {
      await this.cleanup();
    }

    // Normalize and validate parameters
    const normalizedType = normalizeType(type);
    const normalizedMode = normalizeMode(mode);
    const serviceKey = `${normalizedType}_${normalizedMode}`;

    if (serviceKey === "inmemory_sync") {
      this._service = new KuzuInMemorySync();
      await this._service.initialize();
    }
    else if (serviceKey === "inmemory_async") {
      this._service = new KuzuInMemoryAsync();
      await this._service.initialize();
    }
    else if (serviceKey === "persistent_sync") {
      const persistentService = new KuzuPersistentSync();
      await persistentService.initialize();
      this._service = persistentService;
      await this.ensureDefaultPersistentDatabase(
        persistentService,
        options?.dbPath,
        options?.dbOptions
      );
    }
    else if (serviceKey === "persistent_async") {
      const persistentService = new KuzuPersistentAsync();
      await persistentService.initialize();
      this._service = persistentService;
      await this.ensureDefaultPersistentDatabase(
        persistentService,
        options?.dbPath,
        options?.dbOptions
      );
    }
    else {
      // This should never happen due to normalization, but kept for safety
      throw new Error(`Invalid Kuzu type '${type}' or mode '${mode}'`);
    }

    return this._service;
  }

  /**
   * Execute a Cypher query.
   *
   * @param query - The Cypher query to execute.
   * @returns Query results.
   */
  executeQuery(query: string) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.executeQuery(query);
  }

  /**
   * Get column types from a query result
   *
   * @param query - The Cypher query to execute.
   * @returns Array of column type strings.
   */
  async getColumnTypes(query: string): Promise<string[]> {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    const result = this._service.getColumnTypes(query);
    return isPromise<string[]>(result) ? await result : result;
  }

  snapshotGraphState() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.snapshotGraphState();
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this._service) {
      await this._service.cleanup();
      this._service = null;
    }
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
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createSchema(
      type,
      tableName,
      primaryKey,
      properties,
      relInfo
    );
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
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createNodeSchema(
      tableName,
      primaryKey,
      primaryKeyType,
      properties,
      relInfo
    );
  }

  createNode(
    tableName: string,
    properties: Record<
      string,
      { value: any; success?: boolean; message?: string }
    >
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createNode(tableName, properties);
  }

  createEdgeSchema(
    tableName: string,
    tablePairs: Array<[string | number, string | number]>,
    properties: (
      | { name: string; type: NonPrimaryKeyType }
      | { name: string; type: PrimaryKeyType }
    )[],
    isDirected: boolean,
    relationshipType?: "MANY_ONE" | "ONE_MANY" | "MANY_MANY" | "ONE_ONE",
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createEdgeSchema(
      tableName,
      tablePairs,
      properties,
      relationshipType,
      isDirected
    );
  }

  createEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTable: EdgeSchema,
    isDirected: boolean,
    attributes?: Record<string, InputChangeResult<any>>,
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createEdge(node1, node2, edgeTable, attributes, isDirected);
  }

  updateNode(node: GraphNode, values: Record<string, InputChangeResult<any>>) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.updateNode(node, values);
  }

  async deleteEdge(node1: GraphNode, node2: GraphNode, edgeTableName: string, isDirected: boolean = true) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.deleteEdge(node1, node2, edgeTableName, isDirected);
  }

  updateEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
    values: Record<string, InputChangeResult<any>>,
    isDirected: boolean = true
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.updateEdge(node1, node2, edgeTableName, values, isDirected);
  }
  deleteNode(node: GraphNode) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.deleteNode(node);
  }

  getAllSchemaProperties() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.getAllSchemaProperties();
  }

  getSingleSchemaProperties(tableName: string) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.getSingleSchemaProperties(tableName);
  }

  /**
   * Import graph data from CSV files
   * @param nodesText - Content of the nodes CSV file
   * @param edgesText - Content of the edges CSV file
   * @param nodeTableName - Name for the node table
   * @param edgeTableName - Name for the edge table
   * @param isDirected - Whether the graph is directed
   * @returns Import result with success status and graph state
   */
  async importFromCSV(
    nodesText: string,
    edgesText: string,
    nodeTableName: string,
    edgeTableName: string,
    isDirected: boolean
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.importFromCSV(
      nodesText,
      edgesText,
      nodeTableName,
      edgeTableName,
      isDirected
    );
  }

  /**
   * Import graph data from JSON files
   * @param nodesText - Content of the nodes JSON file
   * @param edgesText - Content of the edges JSON file
   * @param nodeTableName - Name for the node table
   * @param edgeTableName - Name for the edge table
   * @param isDirected - Whether the graph is directed
   * @returns Import result with success status and graph state
   */
  async importFromJSON(
    nodesText: string,
    edgesText: string,
    nodeTableName: string,
    edgeTableName: string,
    isDirected: boolean
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.importFromJSON(
      nodesText,
      edgesText,
      nodeTableName,
      edgeTableName,
      isDirected
    );
  }

  // -- Exclusive for Kuzu Persistent --
  
  /**
   * Create a new persistent database
   * Only available for KuzuPersistentSync and KuzuPersistentAsync
   */
  async createDatabase(dbName: string, metadata?: { isDirected?: boolean }) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      throw new Error("createDatabase is only available for persistent mode");
    }
    return await this._service.createDatabase(dbName, metadata);
  }

  /**
   * Delete a persistent database
   * Only available for persistent modes
   */
  async deleteDatabase(dbName: string) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      throw new Error("deleteDatabase is only available for persistent mode");
    }
    return await this._service.deleteDatabase(dbName);
  }

  /**
   * Rename a persistent database
   * Only available for persistent modes
   */
  async renameDatabase(oldName: string, newName: string) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      throw new Error("renameDatabase is only available for persistent mode");
    }
    return await this._service.renameDatabase(oldName, newName);
  }

  /**
   * Connect to an existing persistent database
   * Only available for persistent modes
   * 
   * @param dbPath - Database name (not full path, will be prefixed with kuzu_databases/)
   * @param dbOptions - Database configuration options
   * @returns Result with success status, message, and optional error
   * @throws {Error} If service not initialized or not in persistent mode
   */
  async connectToDatabase(dbPath: string, dbOptions: Record<string, any> = {}): Promise<KuzuDatabaseResult> {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    
    // Validate dbPath
    if (!dbPath || typeof dbPath !== 'string' || dbPath.trim().length === 0) {
      return {
        success: false,
        error: 'Database path must be a non-empty string'
      };
    }

    // Use type guard instead of instanceof
    if (!isPersistentService(this._service)) {
      throw new Error("connectToDatabase is only available for persistent mode");
    }

    // Type is now narrowed to KuzuPersistentSync | KuzuPersistentAsync
    const result = await this._service.connectToDatabase(dbPath.trim(), dbOptions);
    // console.log("here: " + result.metadata.isDirected);
    
    // Normalize return type
    return {
      success: result.success ?? false,
      message: result.message,
      error: result.error,
      database: result.database
    };
  }

  /**
   * Disconnect from current persistent database
   * Only available for persistent modes
   */
  async disconnectFromDatabase() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      throw new Error("disconnectFromDatabase is only available for persistent mode");
    }
    return await this._service.disconnectFromDatabase();
  }

  /**
   * List all available persistent databases
   * Only available for persistent modes
   */
  listDatabases() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      throw new Error("listDatabases is only available for persistent mode");
    }
    return this._service.listDatabases();
  }

  /**
   * Get the name of the currently connected persistent database
   */
  getCurrentDatabaseName(): string | null {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      return null;
    }
    return this._service.getCurrentDatabaseName();
  }

  /**
   * Get metadata for the currently connected persistent database
   * Only available for persistent modes
   */
  getCurrentDatabaseMetadata() {
    if (!this._service) {
      return null;
    }
    if (!isPersistentService(this._service)) {
      return null;
    }
    // Type guard ensures service has getCurrentDatabaseMetadata
    if (typeof (this._service as any).getCurrentDatabaseMetadata === 'function') {
      return (this._service as any).getCurrentDatabaseMetadata();
    }
    return null;
  }

  /**
   * Save current database state to IndexedDB
   * Only available for persistent modes
   */
  async saveDatabase() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      throw new Error("saveDatabase is only available for persistent mode");
    }
    return await this._service.saveIDBFS();
  }

  /**
   * Load database state from IndexedDB
   * Only available for persistent modes
   */
  async loadDatabase() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      throw new Error("loadDatabase is only available for persistent mode");
    }
    return await this._service.loadIDBFS();
  }

  /**
   * Clear all persistent databases
   * Only available for persistent modes
   */
  async clearAllDatabases() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!isPersistentService(this._service)) {
      throw new Error("clearAllDatabases is only available for persistent mode");
    }
    return await this._service.clearAllDatabases();
  }

  /**
   * Check if current service is persistent mode (sync or async)
   */
  isPersistentMode(): boolean {
    return isPersistentService(this._service);
  }

  /**
   * Check if current service is in-memory mode (sync or async)
   */
  isInMemoryMode(): boolean {
    if (!this._service) return false;
    // Duck typing: in-memory services don't have persistent methods
    return !isPersistentService(this._service);
  }

  /**
   * Check if current service is using async mode
   */
  isAsyncMode(): boolean {
    if (!this._service) return false;
    // Duck typing: async services have worker or sendMessage method
    // and executeQuery returns Promise
    return (
      typeof (this._service as any).worker !== 'undefined' ||
      typeof (this._service as any).sendMessage === 'function' ||
      typeof (this._service as any).pendingRequests !== 'undefined'
    );
  }

  /**
   * Check if current service is using sync mode
   */
  isSyncMode(): boolean {
    if (!this._service) return false;
    return !this.isAsyncMode();
  }

  private async ensureDefaultPersistentDatabase(
    service: KuzuPersistentSync | KuzuPersistentAsync,
    dbPath?: string,
    dbOptions: Record<string, any> = {}
  ) {
    const normalizedTarget = (dbPath ?? "default").trim().toLowerCase();
    const canonicalTarget = normalizedTarget.length > 0 ? normalizedTarget : "default";

    let actualTarget = canonicalTarget;

    try {
      const listResult = await service.listDatabases();
      const databases: string[] =
        listResult && listResult.success && Array.isArray(listResult.databases)
          ? listResult.databases
          : [];

      const normalizedMap = new Map<string, string>();
      for (const name of databases) {
        if (typeof name !== "string") continue;
        const trimmed = name.trim();
        if (!trimmed) continue;
        const normalized = trimmed.toLowerCase();
        if (!normalizedMap.has(normalized)) {
          normalizedMap.set(normalized, trimmed);
        }
      }

      const existingMatch = normalizedMap.get(canonicalTarget);
      if (existingMatch) {
        actualTarget = existingMatch;
      }
    } catch (error) {
      console.warn(
        "[KuzuController] Unable to inspect persistent databases before connecting:",
        error
      );
    }

    let connectResult = await service.connectToDatabase(
      actualTarget,
      dbOptions || {}
    );

    if (!connectResult?.success) {
      const message = (
        connectResult.error || connectResult.message || ""
      )
        .toString()
        .toLowerCase();
      const notFound = message.includes("does not exist");

      if (notFound && typeof service.createDatabase === "function") {
        const createResult = await service.createDatabase(canonicalTarget);
        if (!createResult?.success) {
          throw new Error(
            createResult?.error ||
              createResult?.message ||
              `Failed to create database '${canonicalTarget}'`
          );
        }

        connectResult = await service.connectToDatabase(
          canonicalTarget,
          dbOptions || {}
        );
        actualTarget = canonicalTarget;
      }
    }

    if (!connectResult?.success) {
      throw new Error(
        connectResult?.error ||
          connectResult?.message ||
          `Failed to connect to database '${actualTarget}'`
      );
    }
  }

  async writeVirtualFile(path: string, content: string): Promise<void> {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!hasVirtualFileSupport(this._service)) {
      throw new Error("writeVirtualFile is not supported by the current service");
    }
    await this._service.writeVirtualFile(path, content);
  }

  async deleteVirtualFile(path: string): Promise<void> {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    if (!hasVirtualFileSupport(this._service)) {
      throw new Error("deleteVirtualFile is not supported by the current service");
    }
    await this._service.deleteVirtualFile(path);
  }
}

const kuzuController = new KuzuController();
export default kuzuController;

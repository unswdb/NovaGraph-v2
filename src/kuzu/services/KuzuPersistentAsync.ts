/**
 * Kuzu Persistent Async Service
 * Uses Web Worker with IndexedDB persistence without blocking the main thread
 */
import type {
  ErrorQueryResult,
  SuccessQueryResult,
} from "../helpers/KuzuQueryResultExtractor.types";

import KuzuAsyncBaseService from "./KuzuAsyncBaseService";
import type KuzuBaseService from "./KuzuBaseService";

import {
  EMPTY_SNAPSHOT_GRAPH_STATE,
  type GraphSnapshotState,
} from "~/features/visualizer/types";

export type DatabaseMetadata = {
  isDirected: boolean;
  createdAt?: string;
  lastModified?: string;
  lastUsedAt?: string;
};

export default class KuzuPersistentAsync extends KuzuAsyncBaseService {
  currentDatabaseName: string | null = null;
  currentDatabaseMetadata: DatabaseMetadata | null = null;
  graphSnapshotStateCache: GraphSnapshotState = EMPTY_SNAPSHOT_GRAPH_STATE;

  constructor() {
    super();
  }

  async initialize() {
    await super.initialize("./workers/kuzu-persistent.worker.ts");

    const databases = await this.listDatabases().catch(() => [] as string[]);
    if (databases.length === 0) {
      await this.createDatabase("default");
      await this.connectToDatabase("default");
      return;
    }

    if (this.currentDatabaseName) {
      await this.connectToDatabase(this.currentDatabaseName);
    }

    const databasesWithMetadata = await Promise.all(
      databases.map(async (name) => {
        const metadata = await this.getMetadata(name).catch(() => null);
        return { name, metadata };
      })
    );
    const lastUsedDatabase = databasesWithMetadata
      .filter((x) => x.metadata && x.metadata.lastUsedAt)
      .sort(
        (a, b) =>
          new Date(b.metadata!.lastUsedAt!).getTime() -
          new Date(a.metadata!.lastUsedAt!).getTime()
      );
    this.currentDatabaseName = lastUsedDatabase[0].name ?? databases[0];
    await this.connectToDatabase(this.currentDatabaseName);
  }

  /**
   * Create a new database
   */
  async createDatabase(dbName: string, metadata?: DatabaseMetadata) {
    await this.sendMessage<{
      success: boolean;
      message: string;
      metadata: DatabaseMetadata;
    }>("createDatabase", {
      dbName,
      metadata: {
        ...metadata,
        isDirected: metadata?.isDirected ?? true,
      },
    });
  }

  /**
   * Connect to an existing database
   */
  async connectToDatabase(dbName: string) {
    const result = await this.sendMessage<{
      success: true;
      message: string;
      metadata?: DatabaseMetadata;
    }>("connectToDatabase", { dbName });

    await this.resetGraphState();
    this.currentDatabaseName = dbName;

    // Store metadata from result
    if (result.metadata) {
      this.currentDatabaseMetadata = result.metadata;
    } else {
      // If no metadata in result, try to fetch it
      const metadata = await this.getMetadata(dbName);
      this.currentDatabaseMetadata = metadata;
    }
  }

  /**
   * Disconnect from current database
   */
  async disconnectFromDatabase() {
    await this.sendMessage<{ success: true }>("disconnectFromDatabase", {});
    this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
  }

  /**
   * List all databases
   */
  async listDatabases() {
    const result = await this.sendMessage<{
      success: true;
      databases: string[];
    }>("listDatabases", {});
    return result.databases ?? [];
  }

  /**
   * Get the name of the currently connected database, if any
   */
  async getCurrentDatabaseName() {
    const databases = await this.listDatabases();
    return this.currentDatabaseName ?? databases[0];
  }

  /**
   * Delete a database
   */
  async deleteDatabase(dbName: string) {
    await this.sendMessage<{ success: true; message: string }>(
      "deleteDatabase",
      { dbName }
    );
  }

  /**
   * Rename a database
   */
  async renameDatabase(oldName: string, newName: string) {
    await this.sendMessage<{ success: true; message: string }>(
      "renameDatabase",
      {
        oldName,
        newName,
      }
    );
    if (this.currentDatabaseName === oldName) {
      this.currentDatabaseName = newName;
    }
  }

  /**
   * Save database to IndexedDB
   */
  async saveIDBFS() {
    await this.sendMessage("saveDatabase", {});
  }

  /**
   * Load database from IndexedDB
   */
  async loadIDBFS() {
    await this.sendMessage("loadDatabase", {});
  }

  /**
   * Execute a Cypher query asynchronously
   */
  async executeQuery(query: string) {
    super.checkInitialization();

    const result = await this.sendMessage<
      ReturnType<KuzuBaseService["executeQuery"]>
    >("query", { query, autoSave: true });

    const successQueries: SuccessQueryResult[] = Array.isArray(
      result?.successQueries
    )
      ? result.successQueries
      : [];
    const failedQueries: ErrorQueryResult[] = Array.isArray(
      result?.failedQueries
    )
      ? result.failedQueries
      : [];
    const graphState: GraphSnapshotState = {
      nodes: result.nodes || [],
      edges: result.edges || [],
      nodeTables: result.nodeTables || [],
      edgeTables: result.edgeTables || [],
    };
    this.graphSnapshotStateCache = graphState;

    // Transform worker result to match expected format
    return {
      success: result.success,
      successQueries,
      failedQueries,
      nodes: graphState.nodes || [],
      edges: graphState.edges || [],
      nodeTables: graphState.nodeTables || [],
      edgeTables: graphState.edgeTables || [],
      colorMap: result.colorMap || {},
      resultType: result.resultType || "graph",
    };
  }

  /**
   * Get column types from a query
   */
  async getColumnTypes(query: string): Promise<string[]> {
    super.checkInitialization();

    const result = await this.sendMessage<{
      columnTypes: ReturnType<KuzuBaseService["getColumnTypes"]>;
    }>("getColumnTypes", { query });
    return result.columnTypes || [];
  }

  /**
   * Clear all databases
   */
  async clearAllDatabases() {
    const databases = await this.listDatabases().catch(() => [] as string[]);

    for (const database of databases) {
      await this.deleteDatabase(database);
    }

    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
    this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.worker) {
      // Send cleanup message to worker (will auto-save)
      await this.sendMessage("cleanup", {});

      // Terminate the worker
      this.worker.terminate();
      this.worker = null;
    }

    // Clear pending requests
    this.pendingRequests.clear();

    // Clear variable
    this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
  }

  private async resetGraphState(): Promise<GraphSnapshotState> {
    super.checkInitialization();

    const result = await this.sendMessage<GraphSnapshotState>(
      "snapshotGraphState",
      {}
    );
    const snapshot: GraphSnapshotState = {
      nodes: result?.nodes || [],
      edges: result?.edges || [],
      nodeTables: result?.nodeTables || [],
      edgeTables: result?.edgeTables || [],
    };
    this.graphSnapshotStateCache = snapshot;
    return snapshot;
  }

  snapshotGraphState() {
    return {
      nodes: [...this.graphSnapshotStateCache.nodes],
      edges: [...this.graphSnapshotStateCache.edges],
      nodeTables: [...this.graphSnapshotStateCache.nodeTables],
      edgeTables: [...this.graphSnapshotStateCache.edgeTables],
    };
  }

  async writeVirtualFile(path: string, content: string) {
    super.checkInitialization();
    await this.sendMessage("writeFile", { path, content });
  }

  async deleteVirtualFile(path: string) {
    super.checkInitialization();
    await this.sendMessage("deleteFile", { path });
  }

  /**
   * Get metadata for a specific database
   */
  async getMetadata(dbName: string) {
    const { metadata } = await this.sendMessage<{
      success: true;
      metadata: DatabaseMetadata;
    }>("getMetadata", { dbName });
    return metadata;
  }

  /**
   * Set metadata for a specific database
   */
  async setMetadata(dbName: string, metadata: Partial<DatabaseMetadata>) {
    const result = await this.sendMessage<{
      success: true;
      metadata: DatabaseMetadata;
    }>("setMetadata", {
      dbName,
      metadata,
    });

    // Update cache if this is the currently connected database
    if (this.currentDatabaseName === dbName && !!result.metadata) {
      this.currentDatabaseMetadata = result.metadata;
    }
  }

  /**
   * Get metadata for the currently connected database
   */
  getCurrentDatabaseMetadata(): DatabaseMetadata | null {
    return this.currentDatabaseMetadata;
  }
}

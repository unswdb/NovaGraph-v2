/**
 * Kuzu In-Memory Async Service
 * Uses Web Worker to run database operations without blocking the main thread
 */

import type {
  ErrorQueryResult,
  SuccessQueryResult,
} from "../helpers/KuzuQueryResultExtractor.types";

import KuzuAsyncBaseService from "./KuzuAsyncBaseService";
import type KuzuBaseService from "./KuzuBaseService";
import type { DatabaseMetadata } from "./KuzuPersistentAsync";

import {
  EMPTY_SNAPSHOT_GRAPH_STATE,
  type GraphSnapshotState,
} from "~/features/visualizer/types";

type InMemoryInitOptions = {
  persistent?: boolean;
  autoSave?: boolean;
  dbPath?: string;
  reset?: boolean;
};

export default class KuzuInMemoryAsync extends KuzuAsyncBaseService {
  currentDatabaseName: string | null = null;
  currentDatabaseMetadata: DatabaseMetadata | null = null;
  graphSnapshotStateCache: GraphSnapshotState = EMPTY_SNAPSHOT_GRAPH_STATE;
  private persistentEnabled: boolean = false;

  async initialize(options: InMemoryInitOptions = {}) {
    this.currentDatabaseName = options.dbPath || "default";
    this.currentDatabaseMetadata = {
      isDirected: true,
    };

    this.persistentEnabled = options.persistent === true;

    const initData: Record<string, unknown> = {
      persistent: options.persistent === true,
      autoSave: options.autoSave === true,
    };

    if (options.dbPath) {
      initData.dbPath = options.dbPath;
    }

    if (options.reset) {
      initData.reset = true;
    }

    await super.initialize(
      () =>
        new Worker(
          new URL("./workers/kuzu-inmemory.worker.ts", import.meta.url),
          {
            type: "module",
          }
        ),
      initData
    );
  }

  private async refreshGraphState(): Promise<GraphSnapshotState> {
    super.checkInitialization();

    const result = await super.sendMessage<GraphSnapshotState>(
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

  /**
   * Execute a Cypher query asynchronously
   */
  async executeQuery(query: string) {
    super.checkInitialization();

    const result = await this.sendMessage<
      ReturnType<KuzuBaseService["executeQuery"]>
    >("query", { query });
    const graphState = await this.refreshGraphState();

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

  async saveIDBFS() {
    // In inmemory mode (persistent disabled), do nothing
    if (!this.persistentEnabled) {
      return;
    }
    super.checkInitialization();
    await this.sendMessage("saveDatabase", {});
  }

  async loadIDBFS() {
    // In inmemory mode (persistent disabled), do nothing
    if (!this.persistentEnabled) {
      return;
    }
    super.checkInitialization();
    await this.sendMessage("loadDatabase", {});
    await this.refreshGraphState();
  }

  /**
   * Create a new database
   */
  async createDatabase(dbName: string, metadata?: DatabaseMetadata) {
    super.checkInitialization();
    const result = await this.sendMessage<{
      success: boolean;
      message: string;
      metadata?: DatabaseMetadata;
    }>("createDatabase", {
      dbName,
      metadata: {
        ...metadata,
        isDirected: metadata?.isDirected ?? true,
      },
    });

    // If this is the first database or we're not connected, connect to it
    if (!this.currentDatabaseName) {
      await this.connectToDatabase(dbName);
    }
  }

  /**
   * Connect to an existing database
   */
  async connectToDatabase(dbName: string) {
    super.checkInitialization();
    const result = await this.sendMessage<{
      success: true;
      message: string;
      metadata?: DatabaseMetadata;
    }>("connectToDatabase", { dbName });

    await this.refreshGraphState();
    this.currentDatabaseName = dbName;

    // Store metadata from result
    if (result.metadata) {
      this.currentDatabaseMetadata = result.metadata;
    } else {
      this.currentDatabaseMetadata = {
        isDirected: true,
      };
    }
  }

  /**
   * Disconnect from current database
   */
  async disconnectFromDatabase() {
    super.checkInitialization();
    await this.sendMessage<{ success: true }>("disconnectFromDatabase", {});
    this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
  }

  /**
   * List all databases
   */
  async listDatabases() {
    super.checkInitialization();
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
    if (this.currentDatabaseName) {
      return this.currentDatabaseName;
    }
    const databases = await this.listDatabases();
    return databases.length > 0 ? databases[0] : "default";
  }

  /**
   * Delete a database
   */
  async deleteDatabase(dbName: string) {
    super.checkInitialization();
    await this.sendMessage<{ success: true; message: string }>(
      "deleteDatabase",
      { dbName }
    );

    // If we deleted the current database, switch to default or first available
    if (this.currentDatabaseName === dbName) {
      const databases = await this.listDatabases();
      if (databases.length > 0) {
        await this.connectToDatabase(databases[0]);
      } else {
        this.currentDatabaseName = null;
        this.currentDatabaseMetadata = null;
        this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
      }
    }
  }

  /**
   * Rename a database
   */
  async renameDatabase(oldName: string, newName: string) {
    super.checkInitialization();
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
   * Get metadata for the currently connected database
   */
  getCurrentDatabaseMetadata(): DatabaseMetadata | null {
    return this.currentDatabaseMetadata;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.worker) {
      // Send cleanup message to worker
      await this.sendMessage("cleanup", {});

      // Terminate the worker
      this.worker.terminate();
      this.worker = null;
    }

    // Reject and clear pending requests to avoid hanging promises
    this.failPendingRequests("KuzuInMemoryAsync cleaned up");
    this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
    console.log("KuzuInMemoryAsync cleaned up successfully");
  }
}

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
import type { DatabaseMetadata } from "./KuzuDatabaseRecovery";
import {
  getProblematicDatabases,
  markDatabaseAsProblematic,
  unmarkDatabaseAsProblematic,
  shouldTriggerRecovery,
  type DatabaseRecoveryCallback,
} from "./KuzuDatabaseRecovery";

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
  private recoveryCallback: DatabaseRecoveryCallback | null = null;

  constructor() {
    super();
    
    // Set up error listeners for crash detection
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (
          event.message?.includes('Out of Memory') ||
          event.message?.includes('memory') ||
          event.message?.includes('crash')
        ) {
          if (this.currentDatabaseName) {
            console.warn(`[KuzuInMemoryAsync] Detected crash, marking '${this.currentDatabaseName}' as problematic`);
            markDatabaseAsProblematic(this.currentDatabaseName);
          }
        }
      });
    }
  }

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
   * Set callback for database recovery notifications
   */
  setRecoveryCallback(callback: DatabaseRecoveryCallback | null) {
    this.recoveryCallback = callback;
  }

  /**
   * Attempt to recover by switching to another database
   */
  private async recoverFromDatabaseFailure(
    failedDatabaseName: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Mark the failed database as problematic
      markDatabaseAsProblematic(failedDatabaseName);

      // Get list of available databases
      const databases = await this.listDatabases().catch(() => [] as string[]);
      const problematicDatabases = getProblematicDatabases();

      // Filter out the failed database and all problematic databases
      const availableDatabases = databases.filter(
        (db) => db !== failedDatabaseName && !problematicDatabases.has(db)
      );

      if (availableDatabases.length === 0) {
        // No other databases available, create a default one
        const defaultName = "default";
        try {
          await this.createDatabase(defaultName);
          await this.connectToDatabase(defaultName);

          if (this.recoveryCallback) {
            this.recoveryCallback({
              failedDatabase: failedDatabaseName,
              switchedToDatabase: defaultName,
              reason: `${reason}. Created new default database as no alternatives were available.`,
            });
          }

          // Trigger custom event for UI updates
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kuzu-database-switched', {
              detail: {
                failedDatabase: failedDatabaseName,
                switchedToDatabase: defaultName,
                reason,
              }
            }));
          }

          return true;
        } catch (createError) {
          console.error(
            "[KuzuInMemoryAsync] Failed to create default database during recovery:",
            createError
          );
          return false;
        }
      }

      // Try to connect to the first available database
      const targetDatabase = availableDatabases[0];

      // Disconnect from failed database (if still connected)
      if (this.currentDatabaseName === failedDatabaseName) {
        try {
          await this.disconnectFromDatabase();
        } catch {
          // Ignore disconnect errors during recovery
        }
      }

      // Connect to the alternative database
      await this.connectToDatabase(targetDatabase);

      // Notify callback
      if (this.recoveryCallback) {
        setTimeout(() => {
          if (this.recoveryCallback) {
            this.recoveryCallback({
              failedDatabase: failedDatabaseName,
              switchedToDatabase: targetDatabase,
              reason,
            });
          }
        }, 0);
      }

      // Trigger custom event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kuzu-database-switched', {
          detail: {
            failedDatabase: failedDatabaseName,
            switchedToDatabase: targetDatabase,
            reason,
          }
        }));
      }

      return true;
    } catch (recoveryError) {
      console.error(
        "[KuzuInMemoryAsync] Failed to recover from database failure:",
        recoveryError
      );
      return false;
    }
  }

  /**
   * Execute a Cypher query asynchronously with automatic recovery
   */
  async executeQuery(query: string) {
    super.checkInitialization();

    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if this is a recoverable error
      if (this.currentDatabaseName && shouldTriggerRecovery(errorMessage)) {
        const failedDb = this.currentDatabaseName;
        console.error(`[KuzuInMemoryAsync] Error detected with database '${failedDb}':`, errorMessage);
        markDatabaseAsProblematic(failedDb);

        const recovered = await this.recoverFromDatabaseFailure(
          failedDb,
          `Query execution error: ${errorMessage}`
        );

        if (recovered) {
          // Retry the query on the new database
          return this.executeQuery(query);
        }
      }

      throw error;
    }
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
   * Connect to an existing database with automatic recovery
   */
  async connectToDatabase(dbName: string) {
    super.checkInitialization();

    // Check if database is marked as problematic
    const problematicDatabases = getProblematicDatabases();
    if (problematicDatabases.has(dbName)) {
      const recovered = await this.recoverFromDatabaseFailure(
        dbName,
        `Database '${dbName}' is marked as problematic and will not be connected`
      );
      if (!recovered) {
        throw new Error(`Database '${dbName}' is marked as problematic and recovery failed`);
      }
      return;
    }

    try {
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

      // If database was previously marked as problematic but now connects successfully,
      // remove it from the problematic list
      unmarkDatabaseAsProblematic(dbName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // If connection fails with recoverable error, mark as problematic and try to recover
      if (shouldTriggerRecovery(errorMessage)) {
        markDatabaseAsProblematic(dbName);

        const recovered = await this.recoverFromDatabaseFailure(
          dbName,
          `Failed to connect to database: ${errorMessage}`
        );

        if (!recovered) {
          throw error;
        }
        // Recovery successful, connection already established
        return;
      }

      throw error;
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
   * @param includeProblematic - If false, filter out databases marked as problematic (default: false)
   */
  async listDatabases(includeProblematic: boolean = false): Promise<string[]> {
    super.checkInitialization();
    const result = await this.sendMessage<{
      success: true;
      databases: string[];
    }>("listDatabases", {});
    const allDatabases = result.databases ?? [];

    if (includeProblematic) {
      return allDatabases;
    }

    // Filter out problematic databases
    const problematicDatabases = getProblematicDatabases();
    return allDatabases.filter(db => !problematicDatabases.has(db));
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

    // Remove from problematic databases list when database is deleted
    unmarkDatabaseAsProblematic(dbName);

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

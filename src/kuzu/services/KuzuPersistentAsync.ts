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

/**
 * Callback type for database recovery notifications
 */
export type DatabaseRecoveryCallback = (info: {
  failedDatabase: string;
  switchedToDatabase: string;
  reason: string;
}) => void;

export default class KuzuPersistentAsync extends KuzuAsyncBaseService {
  currentDatabaseName: string | null = null;
  currentDatabaseMetadata: DatabaseMetadata | null = null;
  graphSnapshotStateCache: GraphSnapshotState = EMPTY_SNAPSHOT_GRAPH_STATE;
  private recoveryCallback: DatabaseRecoveryCallback | null = null;

  constructor() {
    super();
  }

  async initialize() {
    try {
      await super.initialize(
        () => {
          try {
            const worker = new Worker(
              new URL("./workers/kuzu-persistent.worker.ts", import.meta.url),
              {
                type: "module",
              }
            );
            return worker;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("[KuzuPersistentAsync] Failed to create worker:", errorMessage);
            throw new Error(`Failed to create worker: ${errorMessage}`);
          }
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[KuzuPersistentAsync] Initialization failed:", errorMessage);
      throw error;
    }

    const databases = await this.listDatabases().catch(() => [] as string[]);
    if (databases.length === 0) {
      await this.createDatabase("default");
      await this.connectToDatabase("default");
      return;
    }

    // Try to connect to databases, starting with the most recently used one
    const databasesWithMetadata = await Promise.all(
      databases.map(async (name) => {
        const metadata = await this.getMetadata(name).catch(() => null);
        return { name, metadata };
      })
    );
    
    // Sort by lastUsedAt, most recent first
    const sortedDatabases = databasesWithMetadata
      .filter((x) => x.metadata && x.metadata.lastUsedAt)
      .sort(
        (a, b) =>
          new Date(b.metadata!.lastUsedAt!).getTime() -
          new Date(a.metadata!.lastUsedAt!).getTime()
      );
    
    // Try to connect to databases in order of preference
    let connected = false;
    let lastError: Error | null = null;
    
    // First, try the most recently used database (if currentDatabaseName is set, prioritize it)
    const preferredDatabases = this.currentDatabaseName
      ? [this.currentDatabaseName, ...sortedDatabases.map(d => d.name).filter(n => n !== this.currentDatabaseName), ...databases.filter(n => !sortedDatabases.some(s => s.name === n) && n !== this.currentDatabaseName)]
      : [...sortedDatabases.map(d => d.name), ...databases.filter(n => !sortedDatabases.some(s => s.name === n))];
    
    for (const dbName of preferredDatabases) {
      try {
        // connectToDatabase already has timeout protection, so we can call it directly
        await this.connectToDatabase(dbName);
        connected = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[KuzuPersistentAsync] Failed to connect to database '${dbName}':`, lastError.message);
        
        // If this was a timeout or connection error, mark the database as potentially corrupted
        // and continue to next database
        if (this.isDatabaseConnectionError(lastError.message) || lastError.message.includes("timeout")) {
          // Continue to next database
          continue;
        }
        // For other errors, still try next database but log the issue
      }
    }
    
    // If all databases failed, create a new default one
    if (!connected) {
      console.warn("[KuzuPersistentAsync] All databases failed to connect, creating new default database");
      try {
        await this.createDatabase("default");
        await this.connectToDatabase("default");
      } catch (createError) {
        const errorMsg = createError instanceof Error ? createError.message : String(createError);
        throw new Error(`Failed to initialize: All databases failed and could not create default. Last error: ${lastError?.message || errorMsg}`);
      }
    }
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

  /**
   * Set callback for database recovery notifications
   */
  setRecoveryCallback(callback: DatabaseRecoveryCallback | null) {
    this.recoveryCallback = callback;
  }

  /**
   * Check if an error indicates database connection failure
   */
  private isDatabaseConnectionError(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const connectionErrorPatterns = [
      /database not connected/i,
      /database.*does not exist/i,
      /failed to connect/i,
      /connection.*closed/i,
      /database.*corrupted/i,
      /database.*crash/i,
      /database.*error/i,
      /operation timeout/i,
    ];
    return connectionErrorPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Attempt to recover by switching to another database
   */
  private async recoverFromDatabaseFailure(
    failedDatabaseName: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Get list of available databases
      const databases = await this.listDatabases().catch(() => [] as string[]);
      
      // Filter out the failed database
      const availableDatabases = databases.filter(
        (db) => db !== failedDatabaseName
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
          return true;
        } catch (createError) {
          console.error(
            "[KuzuPersistentAsync] Failed to create default database during recovery:",
            createError
          );
          return false;
        }
      }

      // Try to connect to the first available database
      // Prefer databases with recent lastUsedAt metadata
      const databasesWithMetadata = await Promise.all(
        availableDatabases.map(async (name) => {
          const metadata = await this.getMetadata(name).catch(() => null);
          return { name, metadata };
        })
      );

      const sortedDatabases = databasesWithMetadata
        .filter((x) => x.metadata && x.metadata.lastUsedAt)
        .sort(
          (a, b) =>
            new Date(b.metadata!.lastUsedAt!).getTime() -
            new Date(a.metadata!.lastUsedAt!).getTime()
        );

      const targetDatabase =
        sortedDatabases[0]?.name ?? availableDatabases[0];

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
        this.recoveryCallback({
          failedDatabase: failedDatabaseName,
          switchedToDatabase: targetDatabase,
          reason,
        });
      }

      return true;
    } catch (recoveryError) {
      console.error(
        "[KuzuPersistentAsync] Failed to recover from database failure:",
        recoveryError
      );
      return false;
    }
  }

  /**
   * Execute query with automatic recovery on database failure
   */
  async executeQuery(
    query: string
  ): Promise<ReturnType<KuzuBaseService["executeQuery"]>> {
    super.checkInitialization();

    try {
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
        message: result.message,
        nodes: graphState.nodes || [],
        edges: graphState.edges || [],
        nodeTables: graphState.nodeTables || [],
        edgeTables: graphState.edgeTables || [],
        colorMap: result.colorMap || {},
        resultType: result.resultType || "graph",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      
      // Check if this is a database connection error
      if (
        this.currentDatabaseName &&
        this.isDatabaseConnectionError(errorMessage)
      ) {
        const failedDb = this.currentDatabaseName;
        const recovered = await this.recoverFromDatabaseFailure(
          failedDb,
          `Database connection error: ${errorMessage}`
        );

        if (recovered) {
          // Retry the query on the new database
          return this.executeQuery(query);
        }
      }

      // If recovery failed or not a connection error, throw
      throw error;
    }
  }

  /**
   * Connect to database with automatic recovery
   * Uses timeout to prevent hanging on corrupted databases
   */
  async connectToDatabase(dbName: string) {
    try {
      // Add timeout to prevent hanging on corrupted databases
      const result = await Promise.race([
        this.sendMessage<{
          success: true;
          message: string;
          metadata?: DatabaseMetadata;
        }>("connectToDatabase", { dbName }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Database connection timeout - database may be corrupted")),
            10000 // 10 second timeout
          )
        ),
      ]);

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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      
      // Log the error for debugging
      console.warn(`[KuzuPersistentAsync] Failed to connect to database '${dbName}':`, errorMessage);
      
      // If connection fails, try to recover
      if (this.isDatabaseConnectionError(errorMessage) || errorMessage.includes("timeout")) {
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
   * Get column types with automatic recovery
   */
  async getColumnTypes(query: string): Promise<string[]> {
    super.checkInitialization();

    try {
      const result = await this.sendMessage<{
        columnTypes: ReturnType<KuzuBaseService["getColumnTypes"]>;
      }>("getColumnTypes", { query });
      return result.columnTypes || [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      
      // Check if this is a database connection error
      if (
        this.currentDatabaseName &&
        this.isDatabaseConnectionError(errorMessage)
      ) {
        const failedDb = this.currentDatabaseName;
        const recovered = await this.recoverFromDatabaseFailure(
          failedDb,
          `Get column types failed: ${errorMessage}`
        );

        if (recovered) {
          // Retry on the new database
          return this.getColumnTypes(query);
        }
      }

      throw error;
    }
  }

  /**
   * Reset graph state with automatic recovery
   */
  private async resetGraphState(): Promise<GraphSnapshotState> {
    super.checkInitialization();

    try {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      
      // Check if this is a database connection error
      if (
        this.currentDatabaseName &&
        this.isDatabaseConnectionError(errorMessage)
      ) {
        const failedDb = this.currentDatabaseName;
        const recovered = await this.recoverFromDatabaseFailure(
          failedDb,
          `Reset graph state failed: ${errorMessage}`
        );

        if (recovered) {
          // Retry on the new database
          return this.resetGraphState();
        }
      }

      throw error;
    }
  }
}

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

import {
  type DatabaseMetadata,
  type DatabaseRecoveryCallback,
  getProblematicDatabases,
  markDatabaseAsProblematic,
  unmarkDatabaseAsProblematic,
  isDatabaseConnectionError,
  shouldTriggerRecovery,
  clearProblematicDatabases as clearProblematicDatabasesUtil,
} from "./KuzuDatabaseRecovery";

// Re-export types for backward compatibility
export type { DatabaseMetadata, DatabaseRecoveryCallback };

export default class KuzuPersistentAsync extends KuzuAsyncBaseService {
  currentDatabaseName: string | null = null;
  currentDatabaseMetadata: DatabaseMetadata | null = null;
  graphSnapshotStateCache: GraphSnapshotState = EMPTY_SNAPSHOT_GRAPH_STATE;
  private recoveryCallback: DatabaseRecoveryCallback | null = null;

  constructor() {
    super();
    
    // Set up page unload handler to mark current database as problematic if page crashes
    if (typeof window !== 'undefined') {
      // Use beforeunload to try to catch crashes
      window.addEventListener('beforeunload', () => {
        if (this.currentDatabaseName) {
          // Don't mark here as it might be a normal page close
          // Instead, we'll rely on error detection during connection
        }
      });
      
      // Listen for error events that might indicate a crash
      window.addEventListener('error', (event) => {
        if (
          event.message?.includes('Out of Memory') ||
          event.message?.includes('memory') ||
          event.message?.includes('crash')
        ) {
          if (this.currentDatabaseName) {
            console.warn(`[KuzuPersistentAsync] Detected crash, marking '${this.currentDatabaseName}' as problematic`);
            markDatabaseAsProblematic(this.currentDatabaseName);
          }
        }
      });
    }
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
    
    // Clean up problematic database markers for databases that no longer exist
    await this.cleanupNonExistentProblematicDatabases();

    const databases = await this.listDatabases().catch(() => [] as string[]);
    if (databases.length === 0) {
      await this.createDatabase("default");
      await this.connectToDatabase("default");
      return;
    }

    // Get list of problematic databases (those that caused crashes)
    const problematicDatabases = getProblematicDatabases();
    
    // Filter out problematic databases
    const availableDatabases = databases.filter(db => !problematicDatabases.has(db));
    
    if (availableDatabases.length === 0) {
      // All databases are problematic, create a new default one
      console.warn("[KuzuPersistentAsync] All databases are marked as problematic, creating new default database");
      const skippedDatabase = this.currentDatabaseName || databases[0] || "unknown";
      await this.createDatabase("default");
      await this.connectToDatabase("default");
      
      // Notify callback about the switch
      if (this.recoveryCallback) {
        this.recoveryCallback({
          failedDatabase: skippedDatabase,
          switchedToDatabase: "default",
          reason: `All databases are marked as problematic (likely caused crashes). Created new default database.`,
        });
      }
      return;
    }

    // If currentDatabaseName is problematic, clear it and don't try to connect
    const skippedProblematicDatabase = this.currentDatabaseName && problematicDatabases.has(this.currentDatabaseName)
      ? this.currentDatabaseName
      : null;
    
    if (skippedProblematicDatabase) {
      console.warn(`[KuzuPersistentAsync] Current database '${skippedProblematicDatabase}' is marked as problematic, skipping it`);
      this.currentDatabaseName = null;
    }

    // Try to connect to databases, starting with the most recently used one
    const databasesWithMetadata = await Promise.all(
      availableDatabases.map(async (name) => {
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
    
    // First, try the most recently used database (if currentDatabaseName is set and not problematic, prioritize it)
    const preferredDatabases = this.currentDatabaseName && !problematicDatabases.has(this.currentDatabaseName)
      ? [this.currentDatabaseName, ...sortedDatabases.map(d => d.name).filter(n => n !== this.currentDatabaseName), ...availableDatabases.filter(n => !sortedDatabases.some(s => s.name === n) && n !== this.currentDatabaseName)]
      : [...sortedDatabases.map(d => d.name), ...availableDatabases.filter(n => !sortedDatabases.some(s => s.name === n))];
    
    let failedDatabaseName: string | null = skippedProblematicDatabase;
    
    for (const dbName of preferredDatabases) {
      // Double check it's not problematic (shouldn't happen, but safety check)
      if (problematicDatabases.has(dbName)) {
        console.warn(`[KuzuPersistentAsync] Skipping problematic database '${dbName}'`);
        continue;
      }
      
      try {
        // connectToDatabase already has timeout protection, so we can call it directly
        await this.connectToDatabase(dbName);
        connected = true;
        // If we successfully connected, remove it from problematic list (in case it was fixed)
        unmarkDatabaseAsProblematic(dbName);
        
        // If we switched from a failed database, notify the callback
        if (failedDatabaseName && this.recoveryCallback) {
          this.recoveryCallback({
            failedDatabase: failedDatabaseName,
            switchedToDatabase: dbName,
            reason: `Database '${failedDatabaseName}' failed to connect during initialization. Automatically switched to '${dbName}'.`,
          });
        }
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[KuzuPersistentAsync] Failed to connect to database '${dbName}':`, lastError.message);
        
        // Record the first failed database for notification
        if (!failedDatabaseName) {
          failedDatabaseName = dbName;
        }
        
        // If this was a timeout, connection error, or memory-related error, mark the database as problematic
        if (shouldTriggerRecovery(lastError.message)) {
          // Mark as problematic to avoid trying again
          markDatabaseAsProblematic(dbName);
          
          // Try to delete the problematic database
          try {
            console.warn(`[KuzuPersistentAsync] Attempting to delete problematic database '${dbName}' during initialization`);
            await this.deleteDatabase(dbName);
            console.log(`[KuzuPersistentAsync] Successfully deleted problematic database '${dbName}'`);
          } catch (deleteError) {
            console.warn(`[KuzuPersistentAsync] Failed to delete problematic database '${dbName}':`, deleteError);
          }
          
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
        
        // Notify callback about the switch
        if (failedDatabaseName && this.recoveryCallback) {
          this.recoveryCallback({
            failedDatabase: failedDatabaseName,
            switchedToDatabase: "default",
            reason: `All databases failed to connect during initialization. Created new default database. Last error: ${lastError?.message || "Unknown error"}`,
          });
        }
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
   * @param includeProblematic - If false, filter out databases marked as problematic (default: false)
   */
  async listDatabases(includeProblematic: boolean = false): Promise<string[]> {
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
   * List all databases including problematic ones
   */
  async listAllDatabases(): Promise<string[]> {
    return this.listDatabases(true);
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
   * Can delete databases even if they are marked as problematic
   */
  async deleteDatabase(dbName: string) {
    // Check if database exists (use listAllDatabases to include problematic ones)
    const allDatabases = await this.listAllDatabases();
    if (!allDatabases.includes(dbName)) {
      throw new Error(`Database '${dbName}' does not exist`);
    }
    
    // If this is the current database, disconnect first
    if (this.currentDatabaseName === dbName) {
      try {
        await this.disconnectFromDatabase();
      } catch {
        // Ignore disconnect errors, continue with deletion
      }
    }
    
    // Delete the database
    await this.sendMessage<{ success: true; message: string }>(
      "deleteDatabase",
      { dbName }
    );
    
    // Remove from problematic databases list when database is deleted
    unmarkDatabaseAsProblematic(dbName);
    
    // Clear the reference if this was the current database
    if (this.currentDatabaseName === dbName) {
      this.currentDatabaseName = null;
      this.currentDatabaseMetadata = null;
      this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
    }
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

    // Reject and clear pending requests to avoid hanging promises
    this.failPendingRequests("KuzuPersistentAsync cleaned up");

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
   * Get list of databases marked as problematic
   */
  getProblematicDatabases(): string[] {
    return Array.from(getProblematicDatabases());
  }

  /**
   * Manually mark a database as problematic
   */
  markDatabaseAsProblematic(dbName: string) {
    markDatabaseAsProblematic(dbName);
  }

  /**
   * Remove a database from problematic list
   */
  unmarkDatabaseAsProblematic(dbName: string) {
    unmarkDatabaseAsProblematic(dbName);
  }

  /**
   * Clear all problematic database markers
   */
  clearProblematicDatabases() {
    clearProblematicDatabasesUtil();
  }

  /**
   * Clean up problematic database markers for databases that no longer exist
   */
  private async cleanupNonExistentProblematicDatabases() {
    try {
      const problematicDatabases = getProblematicDatabases();
      if (problematicDatabases.size === 0) {
        return;
      }
      
      const allDatabases = await this.listAllDatabases();
      const existingDatabases = new Set(allDatabases);
      
      // Remove markers for databases that no longer exist
      let cleaned = false;
      problematicDatabases.forEach((dbName) => {
        if (!existingDatabases.has(dbName)) {
          unmarkDatabaseAsProblematic(dbName);
          cleaned = true;
        }
      });
      
      if (cleaned) {
        console.log("[KuzuPersistentAsync] Cleaned up problematic markers for non-existent databases");
      }
    } catch (error) {
      console.warn("[KuzuPersistentAsync] Failed to cleanup non-existent problematic databases:", error);
    }
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
      
      // Try to delete the problematic database to free up space and allow recreation
      try {
        console.warn(`[KuzuPersistentAsync] Attempting to delete problematic database '${failedDatabaseName}'`);
        await this.deleteDatabase(failedDatabaseName);
        console.log(`[KuzuPersistentAsync] Successfully deleted problematic database '${failedDatabaseName}'`);
      } catch (deleteError) {
        // If deletion fails, log but continue with recovery
        console.warn(`[KuzuPersistentAsync] Failed to delete problematic database '${failedDatabaseName}':`, deleteError);
        // Note: The database is still marked as problematic, so it won't appear in lists
      }
      
      // Get list of available databases
      const databases = await this.listDatabases().catch(() => [] as string[]);
      
      // Get problematic databases and filter them out
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

      // Notify callback (this will trigger UI refresh)
      if (this.recoveryCallback) {
        // Use setTimeout to ensure connection is fully established before callback
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
      
      // Trigger a custom event to notify UI to refresh database list
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
      
      // Check if this is a memory-related error
      if (this.currentDatabaseName && shouldTriggerRecovery(errorMessage)) {
        const failedDb = this.currentDatabaseName;
        console.error(`[KuzuPersistentAsync] Memory error detected with database '${failedDb}', marking as problematic`);
        markDatabaseAsProblematic(failedDb);
        
        const recovered = await this.recoverFromDatabaseFailure(
          failedDb,
          `Memory error: ${errorMessage}`
        );

        if (recovered) {
          // Retry the query on the new database
          return this.executeQuery(query);
        }
      }
      
      // Check if this is a database connection error
      if (
        this.currentDatabaseName &&
        isDatabaseConnectionError(errorMessage)
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
   * Uses shorter timeout to quickly detect problematic databases
   */
  async connectToDatabase(dbName: string) {
    // First, check if database exists
    const allDatabases = await this.listAllDatabases();
    if (!allDatabases.includes(dbName)) {
      throw new Error(`Database '${dbName}' does not exist`);
    }
    
    // Then check if database is marked as problematic
    const problematicDatabases = getProblematicDatabases();
    if (problematicDatabases.has(dbName)) {
      throw new Error(`Database '${dbName}' is marked as problematic and will not be connected`);
    }

    try {
      // Use shorter timeout (5 seconds) to quickly detect memory issues
      const result = await Promise.race([
        this.sendMessage<{
          success: true;
          message: string;
          metadata?: DatabaseMetadata;
        }>("connectToDatabase", { dbName }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Database connection timeout - database may be corrupted or too large")),
            5000 // 5 second timeout for faster detection
          )
        ),
      ]);

      // After connection, try a lightweight health check query
      try {
        await Promise.race([
          this.sendMessage("query", { query: "MATCH (n) RETURN count(n) LIMIT 1", autoSave: false }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Health check timeout - database may be too large")),
              3000 // 3 second timeout for health check
            )
          ),
        ]);
      } catch (healthCheckError) {
        // Health check failed, mark as problematic and disconnect
        const errorMsg = healthCheckError instanceof Error ? healthCheckError.message : String(healthCheckError);
        console.warn(`[KuzuPersistentAsync] Health check failed for '${dbName}':`, errorMsg);
        markDatabaseAsProblematic(dbName);
        
        // Try to disconnect
        try {
          await this.sendMessage("disconnectFromDatabase", {});
        } catch {
          // Ignore disconnect errors
        }
        
        // Try to delete the problematic database
        try {
          console.warn(`[KuzuPersistentAsync] Attempting to delete problematic database '${dbName}' after health check failure`);
          await this.deleteDatabase(dbName);
          console.log(`[KuzuPersistentAsync] Successfully deleted problematic database '${dbName}'`);
        } catch (deleteError) {
          console.warn(`[KuzuPersistentAsync] Failed to delete problematic database '${dbName}':`, deleteError);
        }
        
        throw new Error(`Database '${dbName}' failed health check: ${errorMsg}`);
      }

      await this.resetGraphState();
      this.currentDatabaseName = dbName;

      // If database was previously marked as problematic but now connects successfully,
      // remove it from the problematic list
      unmarkDatabaseAsProblematic(dbName);

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
      
      // If connection fails, mark as problematic and try to recover
      if (shouldTriggerRecovery(errorMessage)) {
        // Mark database as problematic to avoid trying again on next page load
        markDatabaseAsProblematic(dbName);
        
        // Try to delete the problematic database before recovery
        try {
          console.warn(`[KuzuPersistentAsync] Attempting to delete problematic database '${dbName}' before recovery`);
          await this.deleteDatabase(dbName);
          console.log(`[KuzuPersistentAsync] Successfully deleted problematic database '${dbName}'`);
        } catch (deleteError) {
          console.warn(`[KuzuPersistentAsync] Failed to delete problematic database '${dbName}':`, deleteError);
        }
        
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
        isDatabaseConnectionError(errorMessage)
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
        isDatabaseConnectionError(errorMessage)
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

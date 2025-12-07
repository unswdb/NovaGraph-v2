// @ts-ignore
import kuzu from "kuzu-wasm/sync";

import KuzuBaseService from "./KuzuBaseService";
import type { DatabaseMetadata } from "./KuzuDatabaseRecovery";
import {
  getProblematicDatabases,
  markDatabaseAsProblematic,
  unmarkDatabaseAsProblematic,
  shouldTriggerRecovery,
  type DatabaseRecoveryCallback,
} from "./KuzuDatabaseRecovery";

interface DatabaseInfo {
  db: any;
  connection: any;
  metadata: DatabaseMetadata;
}

export default class KuzuInMemorySync extends KuzuBaseService {
  private databases: Map<string, DatabaseInfo> = new Map();
  currentDatabaseName: string | null = null;
  currentDatabaseMetadata: DatabaseMetadata | null = null;
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
            console.warn(`[KuzuInMemorySync] Detected crash, marking '${this.currentDatabaseName}' as problematic`);
            markDatabaseAsProblematic(this.currentDatabaseName);
          }
        }
      });
    }
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
      const databases = await this.listDatabases();
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
            "[KuzuInMemorySync] Failed to create default database during recovery:",
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
        "[KuzuInMemorySync] Failed to recover from database failure:",
        recoveryError
      );
      return false;
    }
  }

  async initialize() {
    if (this.initialized) {
      console.log("Kuzu already initialized, skipping");
      return true;
    }

    try {
      console.log("Starting Kuzu in-memory initialization");

      // Initialize the Kuzu module
      await kuzu.init();
      console.log("Kuzu version:", kuzu.getVersion());

      // Initialize with default database
      const defaultDbName = "default";
      const defaultDb = new kuzu.Database(":memory:");
      const defaultConn = new kuzu.Connection(defaultDb);
      this.databases.set(defaultDbName, {
        db: defaultDb,
        connection: defaultConn,
        metadata: {
          isDirected: true,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
        },
      });
      this.currentDatabaseName = defaultDbName;
      this.currentDatabaseMetadata = {
        isDirected: true,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };

      this.db = defaultDb;
      this.connection = defaultConn;
      console.log("In-memory database created");

      this.initialized = true;
      return true;
    } catch (err) {
      console.error("Failed Kuzu initialization:", err);
      throw err;
    }
  }

  /**
   * Get the virtual file system for Kuzu WASM
   * @returns File system object with mkdir, writeFile, unlink methods
   */
  protected getFileSystem() {
    return kuzu.getFS();
  }

  /**
   * Create a new database
   */
  async createDatabase(dbName: string, metadata?: DatabaseMetadata) {
    if (this.databases.has(dbName)) {
      throw new Error(`Database '${dbName}' already exists`);
    }

    const newDb = new kuzu.Database(":memory:");
    const newConn = new kuzu.Connection(newDb);
    const dbMetadata: DatabaseMetadata = {
      isDirected: metadata?.isDirected ?? true,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };

    this.databases.set(dbName, {
      db: newDb,
      connection: newConn,
      metadata: dbMetadata,
    });

    // If no current database, connect to the newly created one
    if (!this.currentDatabaseName) {
      await this.connectToDatabase(dbName);
    }
  }

  /**
   * Connect to an existing database with automatic recovery
   */
  async connectToDatabase(dbName: string) {
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

    const dbInfo = this.databases.get(dbName);
    if (!dbInfo) {
      throw new Error(`Database '${dbName}' does not exist`);
    }

    try {
      // Try a lightweight health check query
      try {
        const healthCheckResult = dbInfo.connection.query("MATCH (n) RETURN count(n) LIMIT 1");
        healthCheckResult.close();
      } catch (healthCheckError: any) {
        // Health check failed, mark as problematic and try to recover
        const errorMsg = healthCheckError instanceof Error ? healthCheckError.message : String(healthCheckError);
        console.warn(`[KuzuInMemorySync] Health check failed for '${dbName}':`, errorMsg);
        markDatabaseAsProblematic(dbName);

        const recovered = await this.recoverFromDatabaseFailure(
          dbName,
          `Database '${dbName}' failed health check: ${errorMsg}`
        );
        if (!recovered) {
          throw new Error(`Database '${dbName}' failed health check: ${errorMsg}`);
        }
        return;
      }

      // Update last used time
      dbInfo.metadata.lastUsedAt = new Date().toISOString();
      dbInfo.metadata.lastModified = new Date().toISOString();

      // Switch to the database
      this.currentDatabaseName = dbName;
      this.currentDatabaseMetadata = { ...dbInfo.metadata };
      this.db = dbInfo.db;
      this.connection = dbInfo.connection;

      // If database was previously marked as problematic but now connects successfully,
      // remove it from the problematic list
      unmarkDatabaseAsProblematic(dbName);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // If this is a recoverable error, try to recover
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
    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
    // Keep db and connection references but mark as disconnected
    // The actual db/connection remain in the map
  }

  /**
   * List all databases
   * @param includeProblematic - If false, filter out databases marked as problematic (default: false)
   */
  async listDatabases(includeProblematic: boolean = false): Promise<string[]> {
    const allDatabases = Array.from(this.databases.keys());

    if (includeProblematic) {
      return allDatabases;
    }

    // Filter out problematic databases
    const problematicDatabases = getProblematicDatabases();
    return allDatabases.filter(db => !problematicDatabases.has(db));
  }

  /**
   * Get the name of the currently connected database
   */
  async getCurrentDatabaseName(): Promise<string> {
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
    const dbInfo = this.databases.get(dbName);
    if (!dbInfo) {
      throw new Error(`Database '${dbName}' does not exist`);
    }

    // Close the database if it's currently active
    if (this.currentDatabaseName === dbName) {
      if (this.connection) {
        this.connection.close();
        this.connection = null;
      }
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      this.currentDatabaseName = null;
      this.currentDatabaseMetadata = null;
    } else {
      // Close the database connection
      if (dbInfo.connection) {
        dbInfo.connection.close();
      }
      if (dbInfo.db) {
        dbInfo.db.close();
      }
    }

    this.databases.delete(dbName);

    // Remove from problematic databases list when database is deleted
    unmarkDatabaseAsProblematic(dbName);

    // If no databases left, create default
    if (this.databases.size === 0) {
      const defaultDb = new kuzu.Database(":memory:");
      const defaultConn = new kuzu.Connection(defaultDb);
      this.databases.set("default", {
        db: defaultDb,
        connection: defaultConn,
        metadata: {
          isDirected: true,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
        },
      });
      this.currentDatabaseName = "default";
      this.currentDatabaseMetadata = {
        isDirected: true,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };
      this.db = defaultDb;
      this.connection = defaultConn;
    } else if (this.currentDatabaseName === null) {
      // Switch to first available database
      const firstDbName = Array.from(this.databases.keys())[0];
      await this.connectToDatabase(firstDbName);
    }
  }

  /**
   * Rename a database
   */
  async renameDatabase(oldName: string, newName: string) {
    const dbInfo = this.databases.get(oldName);
    if (!dbInfo) {
      throw new Error(`Database '${oldName}' does not exist`);
    }

    if (this.databases.has(newName)) {
      throw new Error(`Database '${newName}' already exists`);
    }

    this.databases.set(newName, {
      ...dbInfo,
      metadata: {
        ...dbInfo.metadata,
        lastModified: new Date().toISOString(),
      },
    });
    this.databases.delete(oldName);

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
   * Execute query with automatic recovery on database failure
   */
  executeQuery(query: string): any {
    this.checkInitialization();

    try {
      const result = super.executeQuery(query);
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if this is a recoverable error
      if (this.currentDatabaseName && shouldTriggerRecovery(errorMessage)) {
        const failedDb = this.currentDatabaseName;
        console.error(`[KuzuInMemorySync] Error detected with database '${failedDb}':`, errorMessage);
        markDatabaseAsProblematic(failedDb);

        // Attempt recovery (async, but we can't await in sync method)
        this.recoverFromDatabaseFailure(
          failedDb,
          `Query execution error: ${errorMessage}`
        ).then((recovered) => {
          if (recovered && this.recoveryCallback) {
            this.recoveryCallback({
              failedDatabase: failedDb,
              switchedToDatabase: this.currentDatabaseName || "unknown",
              reason: `Query execution error: ${errorMessage}`,
            });
          }
        }).catch((recoveryError) => {
          console.error("[KuzuInMemorySync] Recovery failed:", recoveryError);
        });

        // Re-throw the original error
        throw error;
      }

      throw error;
    }
  }

  cleanup() {
    // Close all databases
    for (const [name, dbInfo] of this.databases.entries()) {
      if (dbInfo.connection) {
        dbInfo.connection.close();
      }
      if (dbInfo.db) {
        dbInfo.db.close();
      }
    }
    this.databases.clear();
    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
    this.db = null;
    this.connection = null;
    this.initialized = false;
  }
}

// @ts-ignore 'kuzu-wasm/sync' is a JS api file from kuzu-wasm node module

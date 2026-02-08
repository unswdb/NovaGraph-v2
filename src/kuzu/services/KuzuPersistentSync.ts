// @ts-ignore
import kuzu from "kuzu-wasm/sync";
import KuzuGraphHelper from "../helpers/KuzuGraphHelper";
import KuzuBaseService from "./KuzuBaseService";
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

const DATABASES_DIR = "kuzu_databases";
const DB_FILE_NAME = "database.kuzu";
const METADATA_FILE_NAME = "metadata.json";

interface DirectoryRemovalResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface DatabaseOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  databases?: string[];
  database?: any;
}

const normalizePath = (filePath: string): string =>
  filePath.startsWith("/") ? filePath : `/${filePath}`;

const ensureParentDirectory = (fs: any, filePath: string): void => {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf("/");
  const dirPath = lastSlash <= 0 ? "/" : normalized.slice(0, lastSlash);

  if (dirPath === "/") {
    return;
  }

  const segments = dirPath.split("/").filter(Boolean);
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    try {
      fs.mkdir(currentPath);
    } catch (error) {
      // Ignore already-exists errors
    }
  }
};

export default class KuzuPersistentSync extends KuzuBaseService {
  currentDatabaseName: string | null = null;
  currentDatabaseMetadata: DatabaseMetadata | null = null;
  graphSnapshotStateCache: GraphSnapshotState = EMPTY_SNAPSHOT_GRAPH_STATE;
  private recoveryCallback: DatabaseRecoveryCallback | null = null;

  constructor() {
    super();
    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;

    // Set up error listeners for crash detection
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (
          event.message?.includes('Out of Memory') ||
          event.message?.includes('memory') ||
          event.message?.includes('crash')
        ) {
          if (this.currentDatabaseName) {
            console.warn(`[KuzuPersistentSync] Detected crash, marking '${this.currentDatabaseName}' as problematic`);
            markDatabaseAsProblematic(this.currentDatabaseName);
          }
        }
      });
    }
  }

  getDatabaseDir(dbName: string): string {
    return `${DATABASES_DIR}/${dbName}`;
  }

  getDatabaseFilePath(dbName: string): string {
    return `${this.getDatabaseDir(dbName)}/${DB_FILE_NAME}`;
  }

  getMetadataFilePath(dbName: string): string {
    return `${this.getDatabaseDir(dbName)}/${METADATA_FILE_NAME}`;
  }

  /**
   * Save metadata for a database
   */
  private saveMetadata(dbName: string, metadata: DatabaseMetadata): void {
    const metadataPath = this.getMetadataFilePath(dbName);
    const metadataJson = JSON.stringify(metadata, null, 2);
    const fs = kuzu.getFS();
    ensureParentDirectory(fs, metadataPath);
    fs.writeFile(metadataPath, metadataJson);
  }

  /**
   * Load metadata for a database
   */
  private loadMetadata(dbName: string): DatabaseMetadata {
    const metadataPath = this.getMetadataFilePath(dbName);

    try {
      if (this.fileExists(metadataPath)) {
        const metadataContent = kuzu
          .getFS()
          .readFile(metadataPath, { encoding: "utf8" });
        return JSON.parse(metadataContent) as DatabaseMetadata;
      }
    } catch (error) {
      console.warn(`[KuzuPersistentSync] Failed to load metadata for ${dbName}:`, error);
    }

    // Return default metadata if file doesn't exist or fails to load
    return {
      isDirected: true,
    };
  }

  /**
   * @param {string} path
   * @returns true if directory exist, false otherwise
   */
  directoryExists(path: string): boolean {
    try {
      const stats = kuzu.getFS().stat(path);
      return kuzu.getFS().isDir(stats.mode);
    } catch (e) {
      return false;
    }
  }

  /**
   * @param {string} path
   * @returns true if file exist, false otherwise
   */
  fileExists(path: string): boolean {
    try {
      const stats = kuzu.getFS().stat(path);
      return kuzu.getFS().isFile(stats.mode);
    } catch (e) {
      return false;
    }
  }

  /**
   * Removes a directory within the databases directory.
   *
   * @param {string} path - The relative path to the directory to be removed
   * @returns {Object} Result object with success status and message/error
   */
  removeDirectory(path: string): DirectoryRemovalResult {
    path = `${DATABASES_DIR}/${path}`;
    return this.removeDirectoryRecursive(path);
  }

  /**
   * Recursively removes a directory and all its contents (files and subdirectories).
   *
   * @param {string} path - The absolute path to the directory to be removed
   * @returns {Object} Result object containing:
   *   - success {boolean} - Whether the operation was successful
   *   - message {string} - Success message (if operation succeeded)
   *   - error {string} - Error message (if operation failed)
   * @private
   */
  removeDirectoryRecursive(path: string): DirectoryRemovalResult {
    try {
      const fs = kuzu.getFS();
      const entries = fs.readdir(path);
      for (const entry of entries) {
        if (entry === "." || entry === "..") continue;

        const fullPath = path + "/" + entry;
        if (this.directoryExists(fullPath)) {
          const result = this.removeDirectoryRecursive(fullPath);
          if (!result.success) return result;
        } else if (this.fileExists(fullPath)) {
          fs.unlink(fullPath);
        } else {
          return {
            success: false,
            error: `Failed to delete directory entry at ${fullPath}`,
          };
        }
      }

      // Now the directory should be empty, remove it
      fs.rmdir(path);
      return {
        success: true,
        message: `Successfully removed directory: ${path}`,
      };
    } catch (error: any) {
      console.error(`Error removing directory ${path}:`, error);
      return {
        success: false,
        error: `Failed to delete directory: ${path}. ${error.message}`,
      };
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

      // Try to delete the problematic database
      try {
        console.warn(`[KuzuPersistentSync] Attempting to delete problematic database '${failedDatabaseName}'`);
        await this.deleteDatabase(failedDatabaseName);
        console.log(`[KuzuPersistentSync] Successfully deleted problematic database '${failedDatabaseName}'`);
      } catch (deleteError) {
        console.warn(`[KuzuPersistentSync] Failed to delete problematic database '${failedDatabaseName}':`, deleteError);
      }

      // Get list of available databases
      const listResult = this.listDatabases();
      if (!listResult.success) {
        throw new Error("Failed to list databases during recovery");
      }

      const databases = listResult.databases || [];
      const problematicDatabases = getProblematicDatabases();

      // Filter out the failed database and all problematic databases
      const availableDatabases = databases.filter(
        (db) => db !== failedDatabaseName && !problematicDatabases.has(db)
      );

      if (availableDatabases.length === 0) {
        // No other databases available, create a default one
        const defaultName = "default";
        try {
          const createResult = await this.createDatabase(defaultName);
          if (!createResult.success) {
            throw new Error(createResult.error || "Failed to create default database");
          }
          const connectResult = await this.connectToDatabase(defaultName);
          if (!connectResult.success) {
            throw new Error(connectResult.error || "Failed to connect to default database");
          }

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
        } catch (createError: any) {
          console.error(
            "[KuzuPersistentSync] Failed to create default database during recovery:",
            createError
          );
          return false;
        }
      }

      // Try to connect to the first available database
      // Prefer databases with recent lastUsedAt metadata
      const databasesWithMetadata = availableDatabases.map((name) => {
        try {
          const metadata = this.loadMetadata(name);
          return { name, metadata };
        } catch {
          return { name, metadata: null };
        }
      });

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
      const connectResult = await this.connectToDatabase(targetDatabase);
      if (!connectResult.success) {
        throw new Error(connectResult.error || "Failed to connect to alternative database");
      }

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
        "[KuzuPersistentSync] Failed to recover from database failure:",
        recoveryError
      );
      return false;
    }
  }

  /**
   * Deletes a Kuzu database
   * @param {string} dbName - Name of the database to delete
   */
  async deleteDatabase(dbName: string): Promise<DatabaseOperationResult> {
    try {
      if (this.currentDatabaseName === dbName) {
        this.currentDatabaseName = null;
        this.currentDatabaseMetadata = null;
        this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
      }
      const path = this.getDatabaseDir(dbName);

      // Check if database exists
      if (!this.directoryExists(path)) {
        return {
          success: false,
          error: `Failed to deleteDatabase: ${dbName}. Database does not exist`,
        };
      }

      // Remove all files and directories
      const removal = this.removeDirectoryRecursive(path);
      if (!removal.success) {
        return removal;
      }

      // Remove from problematic databases list when database is deleted
      unmarkDatabaseAsProblematic(dbName);

      return {
        success: true,
        message: `Successfully removed directory: ${dbName}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to deleteDatabase: ${dbName}. ${error.message}`,
      };
    }
  }

  /**
   * create a Kuzu database
   * @param {string} dbName - name of the database
   */
  async createDatabase(dbName: string, metadata?: DatabaseMetadata): Promise<DatabaseOperationResult> {
    try {
      const dbDir = this.getDatabaseDir(dbName);
      const dbFile = this.getDatabaseFilePath(dbName);

      // Check if database already exists
      if (this.directoryExists(dbDir)) {
        return {
          success: false,
          error: `Database '${dbName}' already exists`,
        };
      }

      // Create directory first
      await kuzu.getFS().mkdir(dbDir);

      // Initialize the database by creating a Database instance
      // This creates the necessary database files
      const tempDb = new kuzu.Database(dbFile);
      const tempConn = new kuzu.Connection(tempDb);
      tempConn.close();
      tempDb.close();

      // Save metadata
      const newMetadata: DatabaseMetadata = {
        isDirected: metadata?.isDirected ?? true,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };
      this.saveMetadata(dbName, newMetadata);

      // Save to IndexedDB
      await this.saveIDBFS();

      return {
        success: true,
        message: "Successfully created database: " + dbName,
      };
    } catch (e: any) {
      // If it's a "file exists" error, treat it as already exists
      if (e.message && e.message.includes("File exists")) {
        return {
          success: false,
          error: `Database '${dbName}' already exists`,
        };
      }
      return {
        success: false,
        error: "Failed creating database with error: " + e,
      };
    }
  }

  /**
   * Renames a Kuzu database
   * @param {string} oldName - Current name of the database
   * @param {string} newName - New name for the database
   */
  async renameDatabase(oldName: string, newName: string): Promise<DatabaseOperationResult> {
    try {
      if (oldName == newName) {
        return {
          success: true,
          message: `Successfully renamed database from '${oldName}' to '${newName}'`,
        };
      }
      const oldPath = `${DATABASES_DIR}/${oldName}`;
      const newPath = `${DATABASES_DIR}/${newName}`;

      // Check if source database exists
      if (!this.directoryExists(oldPath)) {
        return {
          success: false,
          error: `Failed to renameDatabase: Database '${oldName}' does not exist`,
        };
      }

      // Check if target name already exists
      if (this.directoryExists(newPath)) {
        return {
          success: false,
          error: `Failed to renameDatabase: Database '${newName}' already exists`,
        };
      }

      // Rename the directory
      const fs = kuzu.getFS();
      fs.rename(oldPath, newPath);
      if (this.currentDatabaseName === oldName) {
        this.currentDatabaseName = newName;
      }

      return {
        success: true,
        message: `Successfully renamed database from '${oldName}' to '${newName}'`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to renameDatabase: ${error.message}`,
      };
    }
  }

  /**
   * Opens a connection to an existing database
   * @param {string} dbName - Name of the database to connect to
   * @param {Object} options - Database connection options
   */
  async connectToDatabase(dbName: string, options: Record<string, unknown> = {}): Promise<DatabaseOperationResult> {
    try {
      const dirPath = this.getDatabaseDir(dbName);
      const filePath = this.getDatabaseFilePath(dbName);

      // Check if database exists
      if (!this.directoryExists(dirPath) || !this.fileExists(filePath)) {
        return {
          success: false,
          error: `Failed to connectToDatabase: Database '${dbName}' does not exist`,
        };
      }

      // Check if database is marked as problematic
      const problematicDatabases = getProblematicDatabases();
      if (problematicDatabases.has(dbName)) {
        // Try to recover
        const recovered = await this.recoverFromDatabaseFailure(
          dbName,
          `Database '${dbName}' is marked as problematic and will not be connected`
        );
        if (recovered) {
          return {
            success: true,
            message: `Successfully recovered and connected to alternative database`,
          };
        }
        return {
          success: false,
          error: `Database '${dbName}' is marked as problematic and recovery failed`,
        };
      }

      // Create database connection with timeout protection
      try {
        const db = new kuzu.Database(filePath);
        const conn = new kuzu.Connection(db);
        this.connection = conn;
        this.helper = new KuzuGraphHelper(conn);
        this.db = db;
        this.currentDatabaseName = dbName;

        // Load and update metadata
        const loadedMetadata = this.loadMetadata(dbName);
        const newMetadata: DatabaseMetadata = {
          ...loadedMetadata,
          lastModified: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
        };
        this.saveMetadata(dbName, newMetadata);
        this.currentDatabaseMetadata = loadedMetadata;
        await this.saveIDBFS();

        // Reset graph state cache
        this.resetGraphState();

        // Try a lightweight health check query
        try {
          const healthCheckResult = conn.query("MATCH (n) RETURN count(n) LIMIT 1");
          healthCheckResult.close();
        } catch (healthCheckError: any) {
          // Health check failed, mark as problematic and disconnect
          const errorMsg = healthCheckError instanceof Error ? healthCheckError.message : String(healthCheckError);
          console.warn(`[KuzuPersistentSync] Health check failed for '${dbName}':`, errorMsg);
          markDatabaseAsProblematic(dbName);

          try {
            conn.close();
            db.close();
          } catch {
            // Ignore close errors
          }
          this.connection = null;
          this.helper = null;
          this.db = null;
          this.currentDatabaseName = null;

          // Try to recover
          const recovered = await this.recoverFromDatabaseFailure(
            dbName,
            `Database '${dbName}' failed health check: ${errorMsg}`
          );
          if (recovered) {
            return {
              success: true,
              message: `Successfully recovered and connected to alternative database`,
            };
          }

          return {
            success: false,
            error: `Database '${dbName}' failed health check: ${errorMsg}`,
          };
        }

        // If database was previously marked as problematic but now connects successfully,
        // remove it from the problematic list
        unmarkDatabaseAsProblematic(dbName);

        return {
          success: true,
          message: `Successfully connected to database '${dbName}'`,
          database: db,
        };
      } catch (connectionError: any) {
        const errorMessage = connectionError instanceof Error ? connectionError.message : String(connectionError);
        
        // If connection fails with recoverable error, mark as problematic and try to recover
        if (shouldTriggerRecovery(errorMessage)) {
          markDatabaseAsProblematic(dbName);
          
          const recovered = await this.recoverFromDatabaseFailure(
            dbName,
            `Failed to connect to database: ${errorMessage}`
          );

          if (recovered) {
            return {
              success: true,
              message: `Successfully recovered and connected to alternative database`,
            };
          }
        }

        return {
          success: false,
          error: `Failed to connectToDatabase: ${dbName}. ${errorMessage}`,
        };
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If this is a recoverable error, try to recover
      if (shouldTriggerRecovery(errorMessage)) {
        markDatabaseAsProblematic(dbName);
        const recovered = await this.recoverFromDatabaseFailure(
          dbName,
          `Failed to connect to database: ${errorMessage}`
        );
        if (recovered) {
          return {
            success: true,
            message: `Successfully recovered and connected to alternative database`,
          };
        }
      }

      return {
        success: false,
        error: `Failed to connectToDatabase: ${dbName}. ${errorMessage}`,
      };
    }
  }

  /**
   * Closes a database connection,
   * intention is 1 active db at a time
   */
  async disconnectFromDatabase(): Promise<DatabaseOperationResult> {
    try {
      const db = this.getDatabase();
      if (
        !db ||
        db == undefined ||
        db == null ||
        typeof db.close !== "function"
      ) {
        return {
          success: false,
          error:
            "Failed to disconnectFromDatabase: Invalid database connection",
        };
      }

      db.close();
      this.db = null;
      this.currentDatabaseName = null;
      this.currentDatabaseMetadata = null;
      this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;

      return {
        success: true,
        message: "Successfully disconnected database connection",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to disconnectFromDatabase: ${error.message}`,
      };
    }
  }

  /**
   * Saves the current filesystem state to IndexedDB storage.
   */
  async saveIDBFS(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      kuzu.getFS().syncfs(false, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Loads the filesystem state from IndexedDB storage.
   */
  async loadIDBFS(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      kuzu.getFS().syncfs(true, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Lists all databases present in the databases directory.
   *
   * @returns {Object} Result object containing:
   *   - success {boolean} - Whether the operation was successful
   *   - databases {Array<string>} - Array of database names (directory names) if successful
   *   - error {string} - Error message if operation failed
   */
  listDatabases(includeProblematic: boolean = false): DatabaseOperationResult {
    try {
      const entries = kuzu.getFS().readdir(DATABASES_DIR);
      const directories: string[] = [];

      for (const entry of entries) {
        if (entry === "." || entry === "..") continue;

        try {
          const fullPath = `${DATABASES_DIR}/${entry}`;
          const stats = kuzu.getFS().stat(fullPath);

          // Check if it's a directory
          if (kuzu.getFS().isDir(stats.mode)) {
            directories.push(entry);
          }
        } catch (entryError: any) {
          console.warn(
            `Error accessing entry "${entry}": ${entryError.message}`
          );
        }
      }

      // Filter out problematic databases if not including them
      if (!includeProblematic) {
        const problematicDatabases = getProblematicDatabases();
        const filtered = directories.filter(db => !problematicDatabases.has(db));
        return {
          success: true,
          databases: filtered,
        };
      }

      return {
        success: true,
        databases: directories,
      };
    } catch (error: any) {
      console.error(
        `Failed to list databases in ${DATABASES_DIR}: ${error.message}`
      );
      return {
        success: false,
        error: error.message,
        databases: [],
      };
    }
  }

  getCurrentDatabaseName(): string | null {
    return this.currentDatabaseName;
  }

  /**
   * Get metadata for the currently connected database
   */
  getCurrentDatabaseMetadata(): DatabaseMetadata | null {
    return this.currentDatabaseMetadata;
  }

  /**
   * Get metadata for a specific database
   */
  getMetadata(dbName: string): DatabaseMetadata {
    const dbDir = this.getDatabaseDir(dbName);
    if (!this.directoryExists(dbDir)) {
      throw new Error(`Database '${dbName}' does not exist`);
    }
    return this.loadMetadata(dbName);
  }

  /**
   * Set metadata for a specific database
   */
  setMetadata(dbName: string, metadata: Partial<DatabaseMetadata>): void {
    const dbDir = this.getDatabaseDir(dbName);
    if (!this.directoryExists(dbDir)) {
      throw new Error(`Database '${dbName}' does not exist`);
    }

    // Load existing metadata and merge with new values
    const existingMetadata = this.loadMetadata(dbName);
    const updatedMetadata: DatabaseMetadata = {
      ...existingMetadata,
      ...metadata,
      lastModified: new Date().toISOString(),
    };

    this.saveMetadata(dbName, updatedMetadata);

    // Update cache if this is the currently connected database
    if (this.currentDatabaseName === dbName) {
      this.currentDatabaseMetadata = updatedMetadata;
    }
  }

  /**
   * Get snapshot of current graph state (from cache)
   */
  snapshotGraphState() {
    return {
      nodes: [...this.graphSnapshotStateCache.nodes],
      edges: [...this.graphSnapshotStateCache.edges],
      nodeTables: [...this.graphSnapshotStateCache.nodeTables],
      edgeTables: [...this.graphSnapshotStateCache.edgeTables],
    };
  }

  /**
   * Reset graph state cache by reading from database
   */
  private resetGraphState(): GraphSnapshotState {
    if (!this.connection) {
      this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
      return this.graphSnapshotStateCache;
    }
    const snapshot = super.snapshotGraphState();
    this.graphSnapshotStateCache = {
      nodes: snapshot.nodes || [],
      edges: snapshot.edges || [],
      nodeTables: snapshot.nodeTables || [],
      edgeTables: snapshot.edgeTables || [],
    };
    return this.graphSnapshotStateCache;
  }

  async ensureDefaultDatabase(dbName: string = "default"): Promise<DatabaseOperationResult> {
    if (this.currentDatabaseName) {
      return {
        success: true,
        message: `Already connected to ${this.currentDatabaseName}`,
      };
    }

    const listResult = this.listDatabases();
    if (!listResult.success) {
      return {
        success: false,
        error: listResult.error || "Failed to list databases",
      };
    }

    const databases = listResult.databases || [];

    if (!databases.includes(dbName)) {
      const createResult = await this.createDatabase(dbName);
      if (!createResult.success) {
        return createResult;
      }
    }

    const connectResult = await this.connectToDatabase(dbName);
    if (!connectResult.success) {
      return {
        success: false,
        error:
          connectResult.error ||
          connectResult.message ||
          "Failed to connect to database",
      };
    }

    return {
      success: true,
      message: `Connected to ${dbName}`,
    };
  }

  /**
   * Clears all database directories from the designated storage location.
   */
  async clearAllDatabases(): Promise<DatabaseOperationResult> {
    try {
      const entries = kuzu.getFS().readdir(DATABASES_DIR);

      for (const entry of entries) {
        if (entry === "." || entry === "..") continue;

        try {
          const fullPath = `${DATABASES_DIR}/${entry}`;
          const stats = kuzu.getFS().stat(fullPath);

          // Check if it's a directory
          if (kuzu.getFS().isDir(stats.mode)) {
            kuzu.getFS().rmdir(fullPath);
          }
        } catch (entryError: any) {
          console.warn(
            `Error accessing entry "${entry}": ${entryError.message}`
          );
        }
      }
      this.currentDatabaseName = null;
      this.currentDatabaseMetadata = null;
      this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
      return {
        success: true,
        message: "Successfully cleared all databases",
      };
    } catch (error: any) {
      console.error(
        `Failed to clear databases in ${DATABASES_DIR}: ${error.message}`
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Initializes the Kuzu database system.
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.log("Kuzu already initialized, skipping");
      return true;
    }

    try {
      console.log("Starting Kuzu persistent initialization");
      await kuzu.init();
      console.log("Kuzu version:", kuzu.getVersion());

      if (!this.directoryExists(DATABASES_DIR)) {
        await kuzu.getFS().mkdir(DATABASES_DIR);
      }
      await kuzu
        .getFS()
        .mount(kuzu.getFS().filesystems.IDBFS, {}, DATABASES_DIR);
      await this.loadIDBFS();

      // Clean up problematic database markers for databases that no longer exist
      const problematicDatabases = getProblematicDatabases();
      if (problematicDatabases.size > 0) {
        const listResult = this.listDatabases(true);
        if (listResult.success && listResult.databases) {
          const existingDatabases = new Set(listResult.databases);
          let cleaned = false;
          problematicDatabases.forEach((dbName) => {
            if (!existingDatabases.has(dbName)) {
              unmarkDatabaseAsProblematic(dbName);
              cleaned = true;
            }
          });
          if (cleaned) {
            console.log("[KuzuPersistentSync] Cleaned up problematic markers for non-existent databases");
          }
        }
      }

      // Try to connect to available databases, filtering out problematic ones
      const listResult = this.listDatabases();
      if (listResult.success && listResult.databases && listResult.databases.length > 0) {
        // Get metadata for all databases and sort by lastUsedAt
        const databasesWithMetadata = listResult.databases.map((name) => {
          try {
            const metadata = this.loadMetadata(name);
            return { name, metadata };
          } catch {
            return { name, metadata: null };
          }
        });

        // Sort by lastUsedAt, most recent first
        const sortedDatabases = databasesWithMetadata
          .filter((x) => x.metadata && x.metadata.lastUsedAt)
          .sort(
            (a, b) =>
              new Date(b.metadata!.lastUsedAt!).getTime() -
              new Date(a.metadata!.lastUsedAt!).getTime()
          );

        // Try to connect to databases in order of preference
        const preferredDatabases = [
          ...sortedDatabases.map((d) => d.name),
          ...databasesWithMetadata
            .filter((x) => !x.metadata || !x.metadata.lastUsedAt)
            .map((d) => d.name),
        ];

        for (const dbName of preferredDatabases) {
          const connectResult = await this.connectToDatabase(dbName);
          if (connectResult.success) {
            break;
          }
        }
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed Kuzu initialization:", error);
      throw error;
    }
  }

  writeVirtualFile(path: string, content: string): void {
    if (!this.initialized) {
      throw new Error("Kuzu service not initialized");
    }
    const fs = kuzu.getFS();
    const normalized = normalizePath(path);
    ensureParentDirectory(fs, normalized);
    fs.writeFile(normalized, content);
  }

  deleteVirtualFile(path: string): void {
    if (!this.initialized) {
      throw new Error("Kuzu service not initialized");
    }
    const fs = kuzu.getFS();
    const normalized = normalizePath(path);
    try {
      fs.unlink(normalized);
    } catch (error) {
      // Ignore if file already removed
    }
  }

  /**
   * Clean up resources and close connections
   */
  async cleanup(): Promise<DatabaseOperationResult> {
    try {
      // Disconnect from database if connected
      if (this.db) {
        await this.disconnectFromDatabase();
      }

      // Save any pending changes to IndexedDB
      if (this.initialized) {
        await this.saveIDBFS();
      }

      this.connection = null;
      this.helper = null;
      this.initialized = false;
      this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;

      return {
        success: true,
        message: "Successfully cleaned up KuzuPersistentSync",
      };
    } catch (error: any) {
      console.error("Error during cleanup:", error);
      return {
        success: false,
        error: `Failed to cleanup: ${error.message}`,
      };
    }
  }

  /**
   * Execute query with automatic recovery on database failure
   */
  executeQuery(query: string): any {
    this.checkInitialization();

    try {
      const result = super.executeQuery(query);
      
      // Update graph state cache after successful query
      if (result && (result.nodes || result.edges || result.nodeTables || result.edgeTables)) {
        this.graphSnapshotStateCache = {
          nodes: result.nodes || [],
          edges: result.edges || [],
          nodeTables: result.nodeTables || [],
          edgeTables: result.edgeTables || [],
        };
      } else {
        // If result doesn't have graph state, refresh from connection
        this.resetGraphState();
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if this is a recoverable error
      if (this.currentDatabaseName && shouldTriggerRecovery(errorMessage)) {
        const failedDb = this.currentDatabaseName;
        console.error(`[KuzuPersistentSync] Error detected with database '${failedDb}':`, errorMessage);
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
          console.error("[KuzuPersistentSync] Recovery failed:", recoveryError);
        });

        // Re-throw the original error
        throw error;
      }

      throw error;
    }
  }
}


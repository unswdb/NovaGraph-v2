// @ts-ignore
import kuzu from "kuzu-wasm/sync";

import KuzuBaseService from "./KuzuBaseService";
import type { DatabaseMetadata } from "./KuzuPersistentAsync";

interface DatabaseInfo {
  db: any;
  connection: any;
  metadata: DatabaseMetadata;
}

export default class KuzuInMemorySync extends KuzuBaseService {
  private databases: Map<string, DatabaseInfo> = new Map();
  currentDatabaseName: string | null = null;
  currentDatabaseMetadata: DatabaseMetadata | null = null;

  constructor() {
    super();
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
   * Connect to an existing database
   */
  async connectToDatabase(dbName: string) {
    const dbInfo = this.databases.get(dbName);
    if (!dbInfo) {
      throw new Error(`Database '${dbName}' does not exist`);
    }

    // Update last used time
    dbInfo.metadata.lastUsedAt = new Date().toISOString();
    dbInfo.metadata.lastModified = new Date().toISOString();

    // Switch to the database
    this.currentDatabaseName = dbName;
    this.currentDatabaseMetadata = { ...dbInfo.metadata };
    this.db = dbInfo.db;
    this.connection = dbInfo.connection;
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
   */
  async listDatabases(): Promise<string[]> {
    return Array.from(this.databases.keys());
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

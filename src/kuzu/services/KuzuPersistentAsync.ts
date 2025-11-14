/**
 * Kuzu Persistent Async Service
 * Uses Web Worker with IndexedDB persistence without blocking the main thread
 */

import KuzuBaseService from "./KuzuBaseService";

import type {
  EdgeSchema,
  GraphEdge,
  GraphNode,
  NodeSchema,
} from "~/features/visualizer/types";

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

type GraphSnapshot = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeTables: NodeSchema[];
  edgeTables: EdgeSchema[];
};

export interface DatabaseMetadata {
  isDirected: boolean;
  createdAt?: string;
  lastModified?: string;
}

export default class KuzuPersistentAsync extends KuzuBaseService {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, PendingRequest>();
  private currentDatabaseName: string | null = null;
  private isConnected = false;
  private currentDatabaseMetadata: DatabaseMetadata | null = null;
  private graphStateCache: GraphSnapshot = {
    nodes: [],
    edges: [],
    nodeTables: [],
    edgeTables: [],
  };

  constructor() {
    super();
  }

  /**
   * Get the file system for this service
   * Note: In worker-based implementation, file system operations are proxied through the worker
   */
  protected getFileSystem(): any {
    // Since we're using a worker-based implementation, we don't have direct access to the file system
    // File system operations should be done through writeVirtualFile/deleteVirtualFile methods
    return null;
  }

  /**
   * Initialize the async persistent database system
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    // Create Web Worker
    this.worker = new Worker(
      new URL("./workers/kuzu-persistent.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Set up message handler
    this.worker.onmessage = (e) => {
      const { id, type, data, error } = e.data;
      const request = this.pendingRequests.get(id);

      if (request) {
        if (error) {
          request.reject(new Error(error));
        } else {
          request.resolve(data);
        }
        this.pendingRequests.delete(id);
      }
    };

    // Set up error handler
    this.worker.onerror = (error) => {
      console.error("Worker error:", error);
      console.error("Worker error details:", {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
      });
      // Reject all pending requests
      this.pendingRequests.forEach((request) => {
        request.reject(
          new Error(`Worker error: ${error.message || "Unknown error"}`)
        );
      });
      this.pendingRequests.clear();
    };

    // Initialize the worker
    const initResult = await this.sendMessage("init", {});

    this.initialized = true;
    return true;
  }

  /**
   * Send a message to the worker and wait for response
   */
  private sendMessage(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const id = this.messageId++;
      this.pendingRequests.set(id, { resolve, reject });

      this.worker.postMessage({ id, type, data });

      // Set timeout for long-running operations
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Operation timeout: ${type}`));
        }
      }, 120000); // 120 second timeout for persistent operations
    });
  }

  /**
   * Create a new database
   */
  async createDatabase(dbName: string, metadata?: Partial<DatabaseMetadata>) {
    const result = await this.sendMessage("createDatabase", {
      dbName,
      metadata: {
        isDirected: metadata?.isDirected ?? true, // Hardcoded to true for now
      },
    });

    return {
      success: result.success,
      message: result.message,
      metadata: result.metadata,
    };
  }

  /**
   * Connect to an existing database
   */
  async connectToDatabase(dbName: string, options = {}) {
    const result = await this.sendMessage("connectToDatabase", {
      dbName,
      options,
    });
    if (result.success) {
      await this.refreshGraphState();
      this.currentDatabaseName = dbName;
      this.isConnected = true;

      // Store metadata from result
      if (result.metadata) {
        this.currentDatabaseMetadata = result.metadata;
      } else {
        // If no metadata in result, try to fetch it
        const metadataResult = await this.getMetadata(dbName);
        if (metadataResult.success && metadataResult.metadata) {
          this.currentDatabaseMetadata = metadataResult.metadata;
        }
      }
    }
    return {
      success: result.success,
      message: result.message,
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * Disconnect from current database
   */
  async disconnectFromDatabase() {
    const result = await this.sendMessage("disconnectFromDatabase", {});
    if (result.success) {
      this.graphStateCache = {
        nodes: [],
        edges: [],
        nodeTables: [],
        edgeTables: [],
      };
      this.currentDatabaseName = null;
      this.currentDatabaseMetadata = null;
      this.isConnected = false;
    }
    return {
      success: result.success,
      message: "Successfully disconnected from database",
    };
  }

  /**
   * List all databases
   */
  async listDatabases() {
    const result = await this.sendMessage("listDatabases", {});
    return {
      success: result.success,
      databases: result.databases || [],
      error: undefined as string | undefined,
    };
  }

  /**
   * Get the name of the currently connected database, if any
   */
  getCurrentDatabaseName() {
    return this.currentDatabaseName;
  }

  /**
   * Delete a database
   */
  async deleteDatabase(dbName: string) {
    const result = await this.sendMessage("deleteDatabase", { dbName });
    if (result.success && this.currentDatabaseName === dbName) {
      this.currentDatabaseName = null;
      this.isConnected = false;
    }
    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Rename a database
   */
  async renameDatabase(oldName: string, newName: string) {
    const result = await this.sendMessage("renameDatabase", {
      oldName,
      newName,
    });
    if (result.success && this.currentDatabaseName === oldName) {
      this.currentDatabaseName = newName;
    }
    return {
      success: result.success,
      message: result.message,
    };
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
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    const result = await this.sendMessage("query", { query, autoSave: true });
    const successQueries = Array.isArray(result?.successQueries)
      ? result.successQueries
      : [];
    const failedQueries = Array.isArray(result?.failedQueries)
      ? result.failedQueries
      : [];
    const failureDetails =
      failedQueries[0]?.message || result?.message || "Unknown query failure";
    const graphState: GraphSnapshot = {
      nodes: result.nodes || [],
      edges: result.edges || [],
      nodeTables: result.nodeTables || [],
      edgeTables: result.edgeTables || [],
    };
    this.graphStateCache = graphState;

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
      message: result.success
        ? "Query executed successfully"
        : failureDetails,
      error: result.success ? undefined : failureDetails,
    };
  }

  /**
   * Get column types from a query
   */
  async getColumnTypes(query: string): Promise<string[]> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    const result = await this.sendMessage("getColumnTypes", { query });
    return result.columnTypes || [];
  }

  /**
   * Clear all databases
   */
  async clearAllDatabases() {
    const listResult = await this.listDatabases();
    if (!listResult.success) {
      throw new Error("Failed to list databases");
    }

    for (const dbName of listResult.databases) {
      await this.deleteDatabase(dbName);
    }

    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
    this.isConnected = false;

    return {
      success: true,
      message: "Successfully cleared all databases",
    };
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
    this.pendingRequests.forEach((request) => {
      request.reject(new Error("Service cleanup"));
    });
    this.pendingRequests.clear();
    this.graphStateCache = {
      nodes: [],
      edges: [],
      nodeTables: [],
      edgeTables: [],
    };
    this.currentDatabaseName = null;
    this.currentDatabaseMetadata = null;
    this.isConnected = false;

    this.initialized = false;

    return {
      success: true,
      message: "Successfully cleaned up KuzuPersistentAsync",
    };
  }

  private async refreshGraphState(): Promise<GraphSnapshot> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    const result = await this.sendMessage("snapshotGraphState", {});
    const snapshot: GraphSnapshot = {
      nodes: result?.nodes || [],
      edges: result?.edges || [],
      nodeTables: result?.nodeTables || [],
      edgeTables: result?.edgeTables || [],
    };
    this.graphStateCache = snapshot;
    return snapshot;
  }

  snapshotGraphState() {
    return {
      nodes: [...this.graphStateCache.nodes],
      edges: [...this.graphStateCache.edges],
      nodeTables: [...this.graphStateCache.nodeTables],
      edgeTables: [...this.graphStateCache.edgeTables],
    };
  }

  async writeVirtualFile(path: string, content: string) {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }
    await this.sendMessage("writeFile", { path, content });
  }

  async deleteVirtualFile(path: string) {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }
    await this.sendMessage("deleteFile", { path });
  }

  /**
   * Get metadata for a specific database
   */
  async getMetadata(dbName: string) {
    const result = await this.sendMessage("getMetadata", { dbName });
    return {
      success: result.success,
      metadata: result.metadata as DatabaseMetadata,
    };
  }

  /**
   * Set metadata for a specific database
   */
  async setMetadata(dbName: string, metadata: Partial<DatabaseMetadata>) {
    const result = await this.sendMessage("setMetadata", {
      dbName,
      metadata,
    });

    // Update cache if this is the currently connected database
    if (this.currentDatabaseName === dbName && result.metadata) {
      this.currentDatabaseMetadata = result.metadata;
    }

    return {
      success: result.success,
      metadata: result.metadata as DatabaseMetadata,
    };
  }

  /**
   * Get metadata for the currently connected database
   */
  getCurrentDatabaseMetadata(): DatabaseMetadata | null {
    return this.currentDatabaseMetadata;
  }

  async ensureDefaultDatabase(dbName = "default_async_db") {
    if (this.isConnected && this.currentDatabaseName) {
      return {
        success: true,
        message: `Already connected to ${this.currentDatabaseName}`,
      };
    }

    const listResult = await this.listDatabases();
    if (!listResult.success) {
      throw new Error(listResult.error || "Failed to list databases");
    }

    const databases = listResult.databases || [];

    if (!databases.includes(dbName)) {
      const createResult = await this.createDatabase(dbName);
      if (!createResult.success) {
        throw new Error(
          createResult.message || `Failed to create database ${dbName}`
        );
      }
    }

    const connectResult = await this.connectToDatabase(dbName);
    if (!connectResult.success) {
      throw new Error(
        connectResult.error ||
          connectResult.message ||
          "Failed to connect to database"
      );
    }

    return {
      success: true,
      message: `Connected to ${dbName}`,
    };
  }
}

/**
 * Kuzu In-Memory Async Service
 * Uses Web Worker to run database operations without blocking the main thread
 */

import KuzuBaseService from "./KuzuBaseService";
import type {
  ErrorQueryResult,
  SuccessQueryResult,
} from "./KuzuQueryResultExtractor.types";
import type {
  EdgeSchema,
  GraphEdge,
  GraphNode,
  NodeSchema,
} from "~/features/visualizer/types";

type GraphSnapshot = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeTables: NodeSchema[];
  edgeTables: EdgeSchema[];
};

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export default class KuzuInMemoryAsync extends KuzuBaseService {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, PendingRequest>();
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
   * Initialize the async in-memory database
   */
  async initialize() {
    if (this.initialized) {
      console.log("Kuzu async already initialized, skipping");
      return true;
    }

    try {
      console.log("Starting Kuzu in-memory async initialization");

      // Create Web Worker
      this.worker = new Worker(
        new URL('./workers/kuzu-inmemory.worker.ts', import.meta.url),
        { type: 'module' }
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
          request.reject(new Error(`Worker error: ${error.message || 'Unknown error'}`));
        });
        this.pendingRequests.clear();
      };

      // Initialize the worker
      const initResult = await this.sendMessage('init', {});
      console.log("Kuzu async initialized:", initResult);

      await this.refreshGraphState();
      this.initialized = true;
      return true;
    } catch (err) {
      console.error("Failed Kuzu async initialization:", err);
      throw err;
    }
  }

  /**
   * Send a message to the worker and wait for response
   */
  private sendMessage(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
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
      }, 60000); // 60 second timeout
    });
  }

  private async refreshGraphState(): Promise<GraphSnapshot> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    const result = await this.sendMessage('snapshotGraphState', {});
    const snapshot: GraphSnapshot = {
      nodes: result?.nodes || [],
      edges: result?.edges || [],
      nodeTables: result?.nodeTables || [],
      edgeTables: result?.edgeTables || [],
    };
    this.graphStateCache = snapshot;
    return snapshot;
  }

  /**
   * Execute a Cypher query asynchronously
   */
  async executeQuery(query: string) {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    try {
      const result = await this.sendMessage('query', { query });
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

      const failureMessage =
        failedQueries[0]?.message ||
        result?.message ||
        result?.error ||
        "Query execution failed";

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
        message: result.success ? "Query executed successfully" : failureMessage,
      };
    } catch (error) {
      console.error("Query execution error:", error);
      throw error;
    }
  }

  /**
   * Get column types from a query
   */
  async getColumnTypes(query: string): Promise<string[]> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    const result = await this.sendMessage('getColumnTypes', { query });
    return result.columnTypes || [];
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
    await this.sendMessage('writeFile', { path, content });
  }

  async deleteVirtualFile(path: string) {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }
    await this.sendMessage('deleteFile', { path });
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.worker) {
        // Send cleanup message to worker
        await this.sendMessage('cleanup', {});
        
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

      this.initialized = false;
      console.log("KuzuInMemoryAsync cleaned up successfully");
    } catch (error) {
      console.error("Error during cleanup:", error);
      throw error;
    }
  }
}

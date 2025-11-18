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

export default class KuzuInMemoryAsync extends KuzuAsyncBaseService {
  currentDatabaseName: string | null = null;
  currentDatabaseMetadata: DatabaseMetadata | null = null;
  graphSnapshotStateCache: GraphSnapshotState = EMPTY_SNAPSHOT_GRAPH_STATE;

  async initialize() {
    await super.initialize(
      () =>
        new Worker(
          new URL("./workers/kuzu-inmemory.worker.ts", import.meta.url),
          {
            type: "module",
          }
        )
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

    // Clear pending requests
    this.pendingRequests.clear();
    this.graphSnapshotStateCache = EMPTY_SNAPSHOT_GRAPH_STATE;
    console.log("KuzuInMemoryAsync cleaned up successfully");
  }
}

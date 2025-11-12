import KuzuInMemorySync from "../services/KuzuInMemorySync";

import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
import type { CompositeType } from "~/kuzu/types/KuzuDBTypes";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { InputChangeResult } from "~/features/visualizer/inputs";

/**
 * This class is used to handle logic related to Kuzu before exposing into the highest API
 */
class KuzuController {
  // Store current Kuzu type, i.e InMemorySync, Persistence Sync
  // TODO: decide on where to store directed data later
  private _service: KuzuInMemorySync | null = null;
  private _isDirected: boolean = true;

  setDirection(isDirected: boolean) {
    this._isDirected = isDirected;
  }

  getDirection() {
    return this._isDirected;
  }

  constructor() {
    this._service = null;
  }

  // -- General function for all types of Kuzu db --
  /**
   * Initialize Kuzu with specified type and mode
   *
   * @param type - Either `"inmemory"` or `"persistent"`.
   * @param mode - Either `"sync"` or `"async"`.
   * @param options - Additional initialization options.
   * @param options.dbPath - Path/name for persistent database.
   * @param options.dbOptions - Database configuration options.
   *
   * @returns The initialized service.
   */
  async initialize(type: string, mode: string, options = {}) {
    if (this._service) {
      await this.cleanup();
    }

    if (type === "inmemory" && mode === "sync") {
      this._service = new KuzuInMemorySync();
      await this._service.initialize();
    } else {
      throw Error("Other version of Kuzu not implemented yet");
    }
    return this._service;
  }

  /**
   * Execute a Cypher query.
   *
   * @param query - The Cypher query to execute.
   * @returns Query results.
   */
  executeQuery(query: string) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.executeQuery(query);
  }

  snapshotGraphState() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.snapshotGraphState();
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this._service) {
      await this._service.cleanup();
      this._service = null;
    }
  }

  /**
   * Create a node or relationship schema in the database.
   *
   * @param type - Either `"node"` or `"rel"`.
   * @param tableName - Label of the node or relationship.
   * @param properties - Array of property definitions.
   * @param relInfo - For relationships only: `{ fromLabel, toLabel, direction }`.
   * @returns Result of the schema creation query.
   */
  createSchema(
    type: "node" | "rel" | "NODE" | "REL",
    tableName: string,
    primaryKey: string | undefined,
    properties: Record<string, CompositeType>,
    relInfo: { from: string; to: string } | null = null
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createSchema(
      type,
      tableName,
      primaryKey,
      properties,
      relInfo
    );
  }

  createNodeSchema(
    tableName: string,
    primaryKey: string,
    primaryKeyType: PrimaryKeyType,
    properties: {
      name: string;
      type: NonPrimaryKeyType;
      isPrimary?: boolean;
    }[] = [],
    relInfo: { from: string; to: string } | null = null
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createNodeSchema(
      tableName,
      primaryKey,
      primaryKeyType,
      properties,
      relInfo
    );
  }

  createNode(
    tableName: string,
    properties: Record<
      string,
      { value: any; success?: boolean; message?: string }
    >
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createNode(tableName, properties);
  }

  createEdgeSchema(
    tableName: string,
    tablePairs: Array<[string | number, string | number]>,
    properties: (
      | { name: string; type: NonPrimaryKeyType }
      | { name: string; type: PrimaryKeyType }
    )[],
    relationshipType?: "MANY_ONE" | "ONE_MANY" | "MANY_MANY" | "ONE_ONE",
    isDirected: boolean = true
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createEdgeSchema(
      tableName,
      tablePairs,
      properties,
      relationshipType,
      isDirected
    );
  }

  createEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTable: EdgeSchema,
    attributes?: Record<string, InputChangeResult<any>>,
    isDirected: boolean = true
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.createEdge(node1, node2, edgeTable, attributes, isDirected);
  }

  updateNode(node: GraphNode, values: Record<string, InputChangeResult<any>>) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.updateNode(node, values);
  }

  async deleteEdge(node1: GraphNode, node2: GraphNode, edgeTableName: string, isDirected: boolean = true) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.deleteEdge(node1, node2, edgeTableName, isDirected);
  }

  updateEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
    values: Record<string, InputChangeResult<any>>,
    isDirected: boolean = true
  ) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.updateEdge(node1, node2, edgeTableName, values, isDirected);
  }
  deleteNode(node: GraphNode) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.deleteNode(node);
  }

  getAllSchemaProperties() {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.getAllSchemaProperties();
  }

  getSingleSchemaProperties(tableName: string) {
    if (!this._service) {
      throw new Error("Kuzu service not initialized");
    }
    return this._service.getSingleSchemaProperties(tableName);
  }
  // -- Exclusive for Kuzu Persistent --
}

const kuzuController = new KuzuController();
export default kuzuController;

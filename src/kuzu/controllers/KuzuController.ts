import KuzuInMemorySync from "../services/KuzuInMemorySync";

import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
import type { CompositeType, ValueWithType } from "~/kuzu/types/KuzuDBTypes";
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
  private service: KuzuInMemorySync | null = null;
  constructor() {
    this.service = null;
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
    if (this.service) {
      await this.cleanup();
    }

    if (type === "inmemory" && mode === "sync") {
      this.service = new KuzuInMemorySync();
      await this.service.initialize();
    } else {
      throw Error("Other version of Kuzu not implemented yet");
    }

    // const serviceKey = `${type}_${mode}`;

    // if (serviceKey === "inmemory_sync") {
    //   this.service = new KuzuInMemorySync();
    //   await this.service.initialize();
    // }
    // else if (serviceKey === "persistent_sync") {
    //   this.service = new KuzuPersistentSync();
    //   await this.service.initialize();
    // }
    // else if (serviceKey === "inmemory_async") {
    //   throw new Error("In-memory async mode not yet implemented");
    // }
    // else if (serviceKey === "persistent_async") {
    //   throw new Error("Persistent async mode not yet implemented");
    // }
    // else {
    //   throw new Error("Invalid Kuzu type or mode");
    // }

    return this.service;
  }

  /**
   * Execute a Cypher query.
   *
   * @param query - The Cypher query to execute.
   * @returns Query results.
   */
  executeQuery(query: string) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.executeQuery(query);
  }

  snapshotGraphState() {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.snapshotGraphState();
  }

  // /**
  //  * Execute a helper method
  //  * @param {string} operation - The helper method to call
  //  * @param {...any} args - Arguments to pass to the helper method
  //  * @returns {Object} Operation results
  //  */
  // executeHelper(operation, ...args) {
  //   if (!this.service) {
  //     throw new Error("Kuzu service not initialized");
  //   }
  //   return this.service.executeHelper(operation, ...args);
  // }

  // /**
  //  * Set up schema from statements
  //  * @param {Array<string>} schemaStatements - Schema creation statements
  //  * @returns {Object} Result of operation
  //  */
  // setupSchema(schemaStatements) {
  //   if (!this.service) {
  //     throw new Error("Kuzu service not initialized");
  //   }
  //   return this.service.setupSchema(schemaStatements);
  // }

  // /**
  //  * Delete all data
  //  * @returns {Object} Result of operation
  //  */
  // deleteAllData() {
  //   if (!this.service) {
  //     throw new Error("Kuzu service not initialized");
  //   }
  //   return this.service.deleteAllData();
  // }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.service) {
      await this.service.cleanup();
      this.service = null;
    }
  }

  // /**
  //  * Get available helper functions
  //  * @returns {Object} List of available helper methods
  //  */
  // getHelperFunctions() {
  //   if (!this.service) {
  //     throw new Error("Kuzu service not initialized");
  //   }
  //   return this.service.getHelperFunctions();
  // }

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
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.createSchema(
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
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.createNodeSchema(
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
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.createNode(tableName, properties);
  }

  createEdgeSchema(
    tableName: string,
    tablePairs: Array<[string | number, string | number]>,
    properties: (
      | { name: string; type: NonPrimaryKeyType }
      | { name: string; type: PrimaryKeyType }
    )[],
    relationshipType?: "MANY_ONE" | "ONE_MANY" | "MANY_MANY" | "ONE_ONE"
  ) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.createEdgeSchema(
      tableName,
      tablePairs,
      properties,
      relationshipType
    );
  }

  createEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTable: EdgeSchema,
    attributes?: Record<string, InputChangeResult<any>>
  ) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.createEdge(node1, node2, edgeTable, attributes);
  }

  updateNode(node: GraphNode, values: Record<string, InputChangeResult<any>>) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.updateNode(node, values);
  }

  async deleteEdge(node1: GraphNode, node2: GraphNode, edgeTableName: string) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.deleteEdge(node1, node2, edgeTableName);
  }
  // /**
  //  * Builds a Cypher query to delete a node (and all its relationships) by primary key.
  //  *
  //  * @param tableName - Node label (table) to match.
  //  * @param primaryKey - Property name used as primary key.
  //  * @param primaryValue - Primary key value. Supported types:
  //  *   INT, UINT, FLOAT, DOUBLE, DECIMAL, SERIAL,
  //  *   STRING, UUID, DATE, TIMESTAMP, BLOB.
  //  *   (Booleans/JSON not allowed as primary keys.)
  //  *
  //  * @returns Cypher `MATCH … DETACH DELETE` query string.
  //  */
  // deleteNode(tableName: string,
  //   primaryKey: string,
  //   primaryValue: any) {
  //   if (!this.service) {
  //     throw new Error("Kuzu service not initialized");
  //   }
  //   return this.service.deleteNode(tableName, primaryKey, primaryValue);
  // }

  // deleteNodeWithoutPrimary(tableName: string, primaryValue: any) {
  //   if (!this.service) {
  //     throw new Error("Kuzu service not initialized");
  //   }
  //   return this.service.deleteNodeWithoutPrimary(tableName, primaryValue)
  // }

  updateEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
    values: Record<string, InputChangeResult<any>>
  ) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.updateEdge(node1, node2, edgeTableName, values);
  }
  deleteNode(node: GraphNode) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.deleteNode(node);
  }

  getAllSchemaProperties() {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.getAllSchemaProperties();
  }

  getSingleSchemaProperties(tableName: string) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.getSingleSchemaProperties(tableName);
  }
  // -- Exclusive for Kuzu Persistent --
}

const kuzuController = new KuzuController();
export default kuzuController;

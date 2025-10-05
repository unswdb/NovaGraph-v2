import kuzuController from "./kuzu/controllers/KuzuController";
import createModule from "./graph";
import type { CompositeType } from "./types/KuzuDBTypes";
import type { GraphNode } from "./features/visualizer/types";

class MainController {
  // Graph method starts here
  private wasmGraphModule: any = null;

  async getGraphModule() {
    if (!this.wasmGraphModule) {
      try {
        this.wasmGraphModule = await createModule();
      } catch (err) {
        console.error("Failed to load WASM module", err);
        throw err;
      }
    }
    return this.wasmGraphModule;
  }

  // Kuzu db initialization
  async initKuzu(
    type: string = "inmemory",
    mode: string = "sync",
    options: any = {}
  ) {
    return kuzuController.initialize(type, mode);
  }

  // Graph initialization
  async initGraph() {
    const mod = await this.getGraphModule();
    const graph = mod.initGraph();
    return graph;
  }

  // Database operations namespace
  db = {
    async createSchema(
      type: "node" | "rel" | "NODE" | "REL",
      tableName: string,
      primaryKey?: string,
      properties: Record<string, CompositeType> = {},
      relInfo: { from: string; to: string } | null = null
    ) {
      return Promise.resolve(
        kuzuController.createSchema(
          type,
          tableName,
          primaryKey,
          properties,
          relInfo
        )
      );
    },

    async createNode(label: string, properties: Record<string, any> = {}) {
      return Promise.resolve(kuzuController.createNode(label, properties));
    },

    // async deleteNodeWithPrimary(tableName: string,
    //   primaryKey: string,
    //   primaryValue: any) {
    //   return Promise.resolve(kuzuController.deleteNode(tableName, primaryKey, primaryValue));
    // },

    // async deleteNodeWithoutPrimary(tableName: string, primaryValue: any) {
    //   return Promise.resolve(kuzuController.deleteNodeWithoutPrimary(tableName, primaryValue));
    // },

    async deleteNode(node: GraphNode) {
      return Promise.resolve(kuzuController.deleteNode(node));
    },

    // Execute query method
    async executeQuery(query: string) {
      return Promise.resolve(kuzuController.executeQuery(query));
    },

    // snapshotGraphState
    async snapshotGraphState() {
      return Promise.resolve(kuzuController.snapshotGraphState());
    },

    async createEdgeSchema(
      tableName: string,
      tablePairs: Array<[string | number, string | number]>,
      properties?: Record<string, CompositeType>,
      relationshipType?: "MANY_ONE" | "ONE_MANY"
    ) {
      return Promise.resolve(
        kuzuController.createEdgeSchema(
          tableName,
          tablePairs,
          properties,
          relationshipType
        )
      );
    },

    async createEdge(
      node1: GraphNode,
      node2: GraphNode,
      edgeTableName: string,
      attributes?: Record<string, string | number | boolean>
    ) {
      return Promise.resolve(
        kuzuController.createEdge(node1, node2, edgeTableName, attributes)
      );
    },
  };

  _internal = {
    /**
     *
     * @param tableName table name
     * @returns
     * {
          primaryKey: primaryKey,
          primaryKeyType: primaryKeyType,
          properties: Record<Property Name, Property Type>
        }
      * @example await store.controller._internal.getSingleSchemaProperties(`Person`); 
     */
    async getSingleSchemaProperties(tableName: string) {
      return Promise.resolve(
        kuzuController.getSingleSchemaProperties(tableName)
      );
    },

    async getAllSchemaProperties() {
      return Promise.resolve(kuzuController.getAllSchemaProperties());
    },
  };

  algorithms = {};
}

// Singleton instance
const controller = new MainController();
export { controller };

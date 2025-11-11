import kuzuController from "./kuzu/controllers/KuzuController";
import createModule from "./graph";
import type { CompositeType } from "./kuzu/types/KuzuDBTypes";
import type { EdgeSchema, GraphNode } from "./features/visualizer/types";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "./features/visualizer/schema-inputs";
import type { InputChangeResult } from "./features/visualizer/inputs";
import { IgraphController } from "./igraph/IgraphController";

class MainController {
  // Private sector
  private _IgraphController: undefined | IgraphController;
  private async _initKuzu() {
    return kuzuController.initialize("inmemory", "sync", {});
  }
  private async _initIgraph() {
    return await this._IgraphController?.initIgraph();
  }

  // Public sector
  constructor() {
    this._IgraphController = new IgraphController(
      this.db.snapshotGraphState,
      this.db.getGraphDirection
    );
  }

  async getGraphModule() {
    return this._IgraphController?.getIgraphModule();
  }

  async initSystem() {
    await this._initKuzu();
    await this._initIgraph();
  }

  getAlgorithm() {
    if (this._IgraphController === undefined) {
      throw Error("IgraphController is undefinned");
    }
    return this._IgraphController;
  }

  // Database operations namespace
  db = {
    getGraphDirection() {
      // Todo: fix this later once implement graph direction
      return true;
    },

    async createNodeSchema(
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
      return Promise.resolve(
        kuzuController.createNodeSchema(
          tableName,
          primaryKey,
          primaryKeyType,
          properties,
          relInfo
        )
      );
    },

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

    async createNode(
      label: string,
      properties: Record<
        string,
        { value: any; success?: boolean; message?: string }
      >
    ) {
      return Promise.resolve(kuzuController.createNode(label, properties));
    },

    async updateNode(
      node: GraphNode,
      values: Record<string, InputChangeResult<any>>
    ) {
      return Promise.resolve(kuzuController.updateNode(node, values));
    },

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
      directed: boolean,
      properties: (
        | { name: string; type: NonPrimaryKeyType }
        | { name: string; type: PrimaryKeyType }
      )[],
      relationshipType?: "MANY_ONE" | "ONE_MANY" | "MANY_MANY" | "ONE_ONE"
    ) {
      return Promise.resolve(
        kuzuController.createEdgeSchema(
          tableName,
          tablePairs,
          directed,
          properties,
          relationshipType
        )
      );
    },

    async createEdge(
      node1: GraphNode,
      node2: GraphNode,
      directed: boolean,
      edgeTable: EdgeSchema,
      attributes?: Record<string, InputChangeResult<any>>
    ) {
      return Promise.resolve(
        kuzuController.createEdge(node1, node2, directed, edgeTable, attributes)
      );
    },

    async deleteEdge(
      node1: GraphNode,
      node2: GraphNode,
      directed: boolean,
      edgeTableName: string
    ) {
      return Promise.resolve(
        kuzuController.deleteEdge(node1, node2, directed, edgeTableName)
      );
    },

    async updateEdge(
      node1: GraphNode,
      node2: GraphNode,
      edgeTableName: string,
      values: Record<string, InputChangeResult<any>>
    ) {
      return Promise.resolve(
        kuzuController.updateEdge(node1, node2, edgeTableName, values)
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
}

// Singleton instance
const controller = new MainController();
export { controller };

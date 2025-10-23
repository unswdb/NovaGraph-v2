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
  private _IgraphController: undefined | IgraphController;
  constructor() {
    console.log("Constructor for Main Controller!")
    this._IgraphController = new IgraphController(this.db.snapshotGraphState, this.db.getGraphDirection);
    if (this._IgraphController === undefined) {
      console.log("uh oh something aint right")
    }
  }

  async getGraphModule() {
    return this._IgraphController?.getIgraphModule();
  }

  // Kuzu db initialization
  async initKuzu(
    type: string = "inmemory",
    mode: string = "sync",
    options: any = {}
  ) {
    return kuzuController.initialize(type, mode);
  }

  async initIgraph() {
    return await this._IgraphController?.initIgraph();
  }

  async initSystem() {
    await this.initKuzu();
    await this.initIgraph();
  }

  getAlgorithm() {
    console.log("getAlgorithm should be here")
    if (this._IgraphController === undefined) {
      throw Error("IgraphController is undefinned");
    }
    return this._IgraphController;
  }

  // // Graph method starts here
  // private wasmGraphModule: any = null;
  // async getGraphModule() {
  //   if (!this.wasmGraphModule) {
  //     try {
  //       this.wasmGraphModule = await createModule();
  //     } catch (err) {
  //       console.error("Failed to load WASM module", err);
  //       throw err;
  //     }
  //   }
  //   return this.wasmGraphModule;
  // }
  // // Graph initialization
  // async initGraph() {
  //   const mod = await this.getGraphModule();
  //   const graph = mod.initGraph();
  //   return graph;
  // }




  // Database operations namespace
  db = {

    getGraphDirection() {
      // Todo: fix this later once implement graph direction
      return false;
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

    // async deleteNodeWithPrimary(tableName: string,
    //   primaryKey: string,
    //   primaryValue: any) {
    //   return Promise.resolve(kuzuController.deleteNode(tableName, primaryKey, primaryValue));
    // },

    // async deleteNodeWithoutPrimary(tableName: string, primaryValue: any) {
    //   return Promise.resolve(kuzuController.deleteNodeWithoutPrimary(tableName, primaryValue));
    // },

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
          properties,
          relationshipType
        )
      );
    },

    async createEdge(
      node1: GraphNode,
      node2: GraphNode,
      edgeTable: EdgeSchema,
      attributes?: Record<string, InputChangeResult<any>>
    ) {
      return Promise.resolve(
        kuzuController.createEdge(node1, node2, edgeTable, attributes)
      );
    },

    async deleteEdge(
      node1: GraphNode,
      node2: GraphNode,
      edgeTableName: string
    ) {
      return Promise.resolve(
        kuzuController.deleteEdge(node1, node2, edgeTableName)
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

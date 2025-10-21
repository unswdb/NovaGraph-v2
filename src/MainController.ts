import kuzuController from "./kuzu/controllers/KuzuController";
import createModule from "./graph";
import type { CompositeType } from "./kuzu/types/KuzuDBTypes";
import type { EdgeSchema, GraphEdge, GraphNode } from "./features/visualizer/types";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "./features/visualizer/schema-inputs";
import type { InputChangeResult } from "./features/visualizer/inputs";
import { KuzuToIgraphParsing } from "./kuzu/IGraphAdapter/IGraphAdapter";
import { IgraphBFSTranslator } from "./kuzu/IGraphAdapter/IGraphToKuzu/bfs";

class MainController {
  private wasmGraphModule: any = null;
  async initIGraph() {
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

  // Database operations namespace
  db = {
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

  algorithms = {
    BFS: async (
      sourceID: string,
      // nodesNumber: number,
      // edges: GraphEdge[],
      directed: boolean,
    ) => {
      
      const mod = await this.initIGraph();


      let KuzuToIgraph = new Map<string, number>();
      let IgraphToKuzu = new Map<number, string>();
      let kuzuState = await this.db.snapshotGraphState();
      let KuzuToIgraphParsingResult = KuzuToIgraphParsing(kuzuState.nodes.length, kuzuState.edges, directed, KuzuToIgraph, IgraphToKuzu)
      

      console.log("Available functions in graph object:");
      console.log("graph object:", mod);
      console.log("graph keys:", Object.keys(mod));
      console.log("graph methods:", Object.getOwnPropertyNames(mod));
  
      // Check if the function exists
      console.log("create_graph_from_kuzu_to_igraph exists:", typeof mod.create_graph_from_kuzu_to_igraph);
      console.log("create_graph_from_kuzu_to_igraph:", mod.create_graph_from_kuzu_to_igraph);
  
      // List all functions that start with 'create'
      const createFunctions = Object.keys(mod).filter(key => key.startsWith('create'));
      console.log("Functions starting with 'create':", createFunctions);


      await mod.create_graph_from_kuzu_to_igraph(KuzuToIgraphParsingResult.nodes, KuzuToIgraphParsingResult.src, KuzuToIgraphParsingResult.dst, KuzuToIgraphParsingResult.directed, KuzuToIgraphParsingResult.weight);


      console.log(
        "KuzuToIgraph:",
        JSON.stringify(
          Object.fromEntries(KuzuToIgraph),
          (_, v) => (typeof v === "bigint" ? v.toString() : v),
          2
        )
      );
      
      console.log(
        "IgraphToKuzu:",
        JSON.stringify(
          Object.fromEntries(IgraphToKuzu),
          (_, v) => (typeof v === "bigint" ? v.toString() : v),
          2
        )
      );
  


      // Try catch throw mod.what_to_stderr here
      let result;
      try {
        result = await mod.bfs(KuzuToIgraph.get(sourceID));
      }
      catch (err) {
        throw new Error(
          mod && typeof err == "number"
                    ? mod.what_to_stderr(err)
                    : (String(err) ??
                      "An unexpected error occurred. Please try again later.")
          );
      }
      
      
      let translatedResult = IgraphBFSTranslator(IgraphToKuzu, result)
      await mod.cleanupGraph();
      return translatedResult;
    },
  };
}

// Singleton instance
const controller = new MainController();
export { controller };

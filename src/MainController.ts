import kuzuController from "./kuzu/controllers/KuzuController";
import type { CompositeType } from "./kuzu/types/KuzuDBTypes";
import type { EdgeSchema, GraphNode } from "./features/visualizer/types";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "./features/visualizer/schema-inputs";
import type { InputChangeResult } from "./features/visualizer/inputs";
import { IgraphController } from "./igraph/IgraphController";
import { InMemoryGraphManager } from "./lib/InMemoryGraphManager";

class MainController {
  // Private sector
  private _IgraphController: undefined | IgraphController;
  private _inMemoryGraphManager: InMemoryGraphManager | null = null;
  private _currentDatabasePersistent: boolean = true; // Track if current DB is persistent
  private async _initKuzu() {
    // 从环境变量读取配置，如果没有设置则使用默认值
    // 支持两种方式：服务器端 (process.env) 和客户端 (import.meta.env)
    const getEnv = (key: string): string | undefined => {
      if (typeof process !== "undefined" && process.env) {
        return process.env[key];
      }
      if (typeof import.meta !== "undefined" && import.meta.env) {
        // Vite 环境变量需要 VITE_ 前缀，但我们也支持不带前缀的
        return (
          (import.meta.env as any)[key] ||
          (import.meta.env as any)[`VITE_${key}`]
        );
      }
      return undefined;
    };

    const kuzuType = (getEnv("KUZU_TYPE") || "persistent").toLowerCase();
    const kuzuMode = (getEnv("KUZU_MODE") || "async").toLowerCase();
    const dbPath = getEnv("KUZU_DB_PATH");

    // 验证类型和模式
    const validTypes = ["inmemory", "persistent"];
    const validModes = ["sync", "async"];

    if (!validTypes.includes(kuzuType)) {
      console.warn(
        `Invalid KUZU_TYPE: ${kuzuType}. Valid values are: ${validTypes.join(", ")}. Using default: persistent`
      );
    }

    if (!validModes.includes(kuzuMode)) {
      console.warn(
        `Invalid KUZU_MODE: ${kuzuMode}. Valid values are: ${validModes.join(", ")}. Using default: async`
      );
    }

    const finalType = validTypes.includes(kuzuType) ? kuzuType : "persistent";
    const finalMode = validModes.includes(kuzuMode) ? kuzuMode : "async";

    const options: { dbPath?: string; dbOptions?: Record<string, any> } = {};
    if (dbPath) {
      options.dbPath = dbPath;
    }

    console.log(
      `Initializing Kuzu with type: ${finalType}, mode: ${finalMode}${dbPath ? `, dbPath: ${dbPath}` : ""}`
    );

    return kuzuController.initialize(finalType, finalMode, options);
  }
  private async _initIgraph() {
    return await this._IgraphController?.initIgraph();
  }

  // Public sector
  constructor() {
    this._IgraphController = new IgraphController(
      // Bind to ensure 'this' inside db methods points to db namespace
      this.db.snapshotGraphState.bind(this.db),
      this.db.getGraphDirection.bind(this.db)
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
      throw new Error("IgraphController is undefinned");
    }
    return this._IgraphController;
  }

  // Database operations namespace
  db = {
    getGraphDirection() {
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        return this._inMemoryGraphManager.getGraphDirection();
      }
      const metadata = kuzuController.getCurrentDatabaseMetadata?.();
      return metadata?.isDirected ?? true;
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
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        this._inMemoryGraphManager.createNodeSchema(
          tableName,
          primaryKey,
          primaryKeyType,
          properties
        );
        return Promise.resolve(undefined);
      }
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
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        const snapshot = this._inMemoryGraphManager.createNode(label, properties);
        return Promise.resolve(snapshot);
      }
      return Promise.resolve(kuzuController.createNode(label, properties));
    },

    async updateNode(
      node: GraphNode,
      values: Record<string, InputChangeResult<any>>
    ) {
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        const snapshot = this._inMemoryGraphManager.updateNode(node, values);
        return Promise.resolve(snapshot);
      }
      return Promise.resolve(kuzuController.updateNode(node, values));
    },

    async deleteNode(node: GraphNode) {
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        const snapshot = this._inMemoryGraphManager.deleteNode(node);
        return Promise.resolve(snapshot);
      }
      return Promise.resolve(kuzuController.deleteNode(node));
    },

    // Execute query method (adds directed flag based on current DB metadata)
    async executeQuery(query: string) {
      if (!this._currentDatabasePersistent) {
        throw new Error(
          "Query execution is not supported for in-memory (non-persistent) graphs. " +
          "Please use a persistent graph to execute queries."
        );
      }
      const result = await kuzuController.executeQuery(query);
      return {
        ...result,
        directed: this.getGraphDirection(),
      };
    },

    /** CLI-facing executeQuery; actual undirected handling lives in KuzuController. */
    async executeCliQuery(query: string) {
      if (!this._currentDatabasePersistent) {
        throw new Error(
          "Query execution is not supported for in-memory (non-persistent) graphs. " +
          "Please use a persistent graph to execute queries."
        );
      }
      const result = await kuzuController.executeCliQuery(query);
      return {
        ...result,
        directed: this.getGraphDirection(),
      };
    },

    // Get column types from query
    async getColumnTypes(query: string) {
      if (!this._currentDatabasePersistent) {
        throw new Error(
          "Column type inference is not supported for in-memory (non-persistent) graphs. " +
          "Please use a persistent graph to infer column types."
        );
      }
      return kuzuController.getColumnTypes(query);
    },

    // snapshotGraphState
    async snapshotGraphState() {
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        return Promise.resolve(this._inMemoryGraphManager.snapshotGraphState());
      }
      const snapshot = await Promise.resolve(kuzuController.snapshotGraphState());
      return {
        ...snapshot,
        directed: this.getGraphDirection(),
      };
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
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        this._inMemoryGraphManager.createEdgeSchema(
          tableName,
          tablePairs,
          properties,
          relationshipType
        );
        return Promise.resolve(undefined);
      }
      return Promise.resolve(
        kuzuController.createEdgeSchema(
          tableName,
          tablePairs,
          properties,
          this.getGraphDirection(),
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
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        const snapshot = this._inMemoryGraphManager.createEdge(
          node1,
          node2,
          edgeTable,
          attributes
        );
        return Promise.resolve(snapshot);
      }
      return Promise.resolve(
        kuzuController.createEdge(
          node1,
          node2,
          edgeTable,
          this.getGraphDirection(),
          attributes
        )
      );
    },

    async deleteEdge(
      node1: GraphNode,
      node2: GraphNode,
      isDirected: boolean,
      edgeTableName: string
    ) {
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        const snapshot = this._inMemoryGraphManager.deleteEdge(
          node1,
          node2,
          edgeTableName
        );
        return Promise.resolve(snapshot);
      }
      return Promise.resolve(
        kuzuController.deleteEdge(node1, node2, edgeTableName, isDirected)
      );
    },

    async updateEdge(
      node1: GraphNode,
      node2: GraphNode,
      edgeTableName: string,
      values: Record<string, InputChangeResult<any>>
    ) {
      if (!this._currentDatabasePersistent && this._inMemoryGraphManager) {
        const snapshot = this._inMemoryGraphManager.updateEdge(
          node1,
          node2,
          edgeTableName,
          values
        );
        return Promise.resolve(snapshot);
      }
      return Promise.resolve(
        kuzuController.updateEdge(
          node1,
          node2,
          edgeTableName,
          values,
          this.getGraphDirection()
        )
      );
    },

    async writeVirtualFile(path: string, content: string) {
      return kuzuController.writeVirtualFile(path, content);
    },

    async deleteVirtualFile(path: string) {
      return kuzuController.deleteVirtualFile(path);
    },

    async createDatabase(
      dbName: string,
      metadata?: { isDirected?: boolean; persistent?: boolean }
    ) {
      const persistent = metadata?.persistent ?? true;
      this._currentDatabasePersistent = persistent;

      if (!persistent) {
        // Create in-memory graph manager
        this._inMemoryGraphManager = new InMemoryGraphManager(
          metadata?.isDirected ?? true
        );
        // Update IgraphController to use in-memory data source
        if (this._IgraphController) {
          this._IgraphController = new IgraphController(
            this.db.snapshotGraphState.bind(this.db),
            this.db.getGraphDirection.bind(this.db)
          );
          await this._IgraphController.initIgraph();
        }
        return Promise.resolve(undefined);
      }

      return Promise.resolve(kuzuController.createDatabase(dbName, metadata));
    },

    async deleteDatabase(dbName: string) {
      return Promise.resolve(kuzuController.deleteDatabase(dbName));
    },

    async listDatabases() {
      return Promise.resolve(kuzuController.listDatabases());
    },

    async connectToDatabase(dbName: string) {
      // For now, assume connecting to a persistent database
      // In the future, we might need to track which databases are persistent
      this._currentDatabasePersistent = true;
      this._inMemoryGraphManager = null;
      return Promise.resolve(kuzuController.connectToDatabase(dbName));
    },

    async getCurrentDatabaseName() {
      return Promise.resolve(kuzuController.getCurrentDatabaseName());
    },

    async saveDatabase() {
      return Promise.resolve(kuzuController.saveDatabase());
    },

    async loadDatabase() {
      return Promise.resolve(kuzuController.loadDatabase());
    },

    /**
     * Import graph data from CSV files
     * @param databaseName - Name of the database
     * @param nodesText - Content of the nodes CSV file
     * @param edgesText - Content of the edges CSV file
     * @param nodeTableName - Name for the node table
     * @param edgeTableName - Name for the edge table
     * @param isDirected - Whether the graph is directed
     * @param persistent - Whether to store in kuzu (true) or keep in memory (false)
     * @returns Import result with success status and graph state
     */
    async importFromCSV(
      databaseName: string,
      nodesText: string,
      edgesText: string,
      nodeTableName: string,
      edgeTableName: string,
      isDirected: boolean = true,
      persistent: boolean = true
    ) {
      if (!persistent && this._inMemoryGraphManager) {
        const snapshot = await this._inMemoryGraphManager.importFromCSV(
          nodesText,
          edgesText,
          nodeTableName,
          edgeTableName,
          isDirected
        );
        return {
          databaseName,
          ...snapshot,
        };
      }

      const result = await kuzuController.importFromCSV(
        databaseName,
        nodesText,
        edgesText,
        nodeTableName,
        edgeTableName,
        isDirected
      );

      return {
        ...result,
        directed: isDirected,
      };
    },

    /**
     * Import graph data from JSON files
     * @param databaseName - Name of the database
     * @param nodesText - Content of the nodes JSON file
     * @param edgesText - Content of the edges JSON file
     * @param nodeTableName - Name for the node table
     * @param edgeTableName - Name for the edge table
     * @param isDirected - Whether the graph is directed
     * @param persistent - Whether to store in kuzu (true) or keep in memory (false)
     * @returns Import result with success status and graph state
     */
    async importFromJSON(
      databaseName: string,
      nodesText: string,
      edgesText: string,
      nodeTableName: string,
      edgeTableName: string,
      isDirected: boolean = true,
      persistent: boolean = true
    ) {
      if (!persistent && this._inMemoryGraphManager) {
        const snapshot = await this._inMemoryGraphManager.importFromJSON(
          nodesText,
          edgesText,
          nodeTableName,
          edgeTableName,
          isDirected
        );
        return {
          databaseName,
          ...snapshot,
        };
      }

      const result = await kuzuController.importFromJSON(
        databaseName,
        nodesText,
        edgesText,
        nodeTableName,
        edgeTableName,
        isDirected
      );

      return {
        ...result,
        directed: isDirected,
      };
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

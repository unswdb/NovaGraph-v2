import { action, makeObservable, observable, runInAction } from "mobx";
import type {
  GraphDatabase,
  GraphEdge,
  GraphModule,
  GraphNode,
  GraphSchema,
} from "./types";
import {
  GRAVITY,
  NODE_SIZE_SCALE,
  type Gravity,
  type NodeSizeScale,
} from "./renderer/constant";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "./algorithms/implementations";
import { controller } from "~/MainController";

export type InitializedVisualizerStore = VisualizerStore & {
  wasmModule: NonNullable<VisualizerStore["wasmModule"]>;
  database: NonNullable<VisualizerStore["database"]>;
};

export default class VisualizerStore {
  // CONSTRUCTORS
  constructor() {
    makeObservable(this, {
      database: observable,
      databases: observable,
      gravity: observable,
      nodeSizeScale: observable,
      activeAlgorithm: observable,
      activeResponse: observable,
      initialize: action,
      cleanup: action,
      setDatabase: action,
      setGraphState: action,
      setNodes: action,
      setEdges: action,
      setSchema: action,
      addDatabase: action,
      setGravity: action,
      setNodeSizeScale: action,
      setActiveAlgorithm: action,
      setActiveResponse: action,
    });
  }

  // OBSERVABLES
  controller = controller;
  wasmModule: GraphModule | null = null;
  database: GraphDatabase | null = null; // Currently active database
  databases: GraphDatabase[] = []; // List of database users owned
  gravity: Gravity = GRAVITY.ZERO_GRAVITY;
  nodeSizeScale: NodeSizeScale = NODE_SIZE_SCALE.MEDIUM;
  activeAlgorithm: BaseGraphAlgorithm | null = null;
  activeResponse: BaseGraphAlgorithmResult | null = null;

  // ACTIONS
  initialize = async () => {
    // Initialize Kuzu controller
    await this.controller.initKuzu();

    // Initialize WASM module
    this.wasmModule = await this.controller.getGraphModule();

    // Define initial graph structure
    const graph = await this.controller.db.snapshotGraphState();

    runInAction(() => {
      // TODO: Change to controller helper function that retrieves
      // all the database list
      const { nodes, nodesMap } = this.buildNodesWithMap(graph.nodes);
      const { edges, edgesMap } = this.buildEdgesWithMap(graph.edges);
      const tables = this.buildTables(graph.tables);
      this.databases = [
        {
          label: "Default",
          graph: {
            nodes,
            nodesMap,
            edges,
            edgesMap,
            tables,
            directed: true, // TODO: Distinguish between directed/non-directed in Kuzu
          },
        },
      ];
      this.database = this.databases[0];
    });
  };

  cleanup = () => {
    // this.controller.cleanup();
  };

  setDatabase = (database: GraphDatabase) => {
    this.database = database;
  };

  setGraphState = ({
    nodes,
    edges,
    tables,
  }: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    tables: GraphSchema[];
  }) => {
    this.checkInitialization();
    this.database = {
      ...this.database,
      graph: {
        ...this.database.graph,
        nodes,
        edges,
        tables,
      },
    };
  };

  setNodes = (nodes: GraphNode[]) => {
    this.checkInitialization();
    const { nodes: newNodes, nodesMap } = this.buildNodesWithMap(nodes);
    this.database = {
      ...this.database,
      graph: {
        ...this.database.graph,
        nodes: newNodes,
        nodesMap, // can remain plain Map if you don’t need deep reactivity
      },
    };
  };

  setEdges = (edges: GraphEdge[]) => {
    this.checkInitialization();
    const { edges: newEdges, edgesMap } = this.buildEdgesWithMap(edges);
    this.database = {
      ...this.database,
      graph: {
        ...this.database.graph,
        edges: newEdges,
        edgesMap, // can remain plain Map if you don’t need deep reactivity
      },
    };
  };

  setSchema = (schema: GraphSchema[]) => {
    this.checkInitialization();
    this.database = {
      ...this.database,
      graph: {
        ...this.database.graph,
        schema,
      },
    };
  };

  addDatabase = (database: GraphDatabase) => {
    this.databases = [...this.databases, database];
  };

  setGravity = (gravity: Gravity) => {
    this.gravity = gravity;
  };

  setNodeSizeScale = (nodeSizeScale: NodeSizeScale) => {
    this.nodeSizeScale = nodeSizeScale;
  };

  setActiveAlgorithm = (activeAlgorithm: BaseGraphAlgorithm) => {
    this.activeAlgorithm = activeAlgorithm;
  };

  setActiveResponse = (activeResponse: BaseGraphAlgorithmResult) => {
    this.activeResponse = activeResponse;
  };

  // UTILITIES FUNCTION
  protected checkInitialization(): asserts this is InitializedVisualizerStore {
    if (!this.wasmModule && !this.database) {
      throw new Error("WASM module is not initialized");
    }
  }

  private buildTables(tables: GraphSchema[]) {
    return tables.map((t) => ({
      tableName: String(t.tableName),
      tableType: t.tableType,
      primaryKey: String(t.primaryKey),
      primaryKeyType: t.primaryKeyType,
      properties: t.properties,
    }));
  }

  private buildNodesWithMap(nodes: GraphNode[]): {
    nodes: GraphNode[];
    nodesMap: Map<string, GraphNode>;
  } {
    const builtNodes: GraphNode[] = [];
    const nodesMap: Map<string, GraphNode> = new Map();

    nodes.forEach((n) => {
      const builtNode = {
        id: String(n.id),
        _primaryKey: String(n._primaryKey),
        _primaryKeyValue: String(n._primaryKeyValue),
        tableName: String(n.tableName),
        ...(n.attributes ? { attributes: n.attributes } : {}),
      };
      builtNodes.push(builtNode);
      nodesMap.set(n.id, builtNode);
    });

    return { nodes: builtNodes, nodesMap };
  }

  private buildEdgesWithMap(edges: GraphEdge[]): {
    edges: GraphEdge[];
    edgesMap: Map<[string, string], GraphEdge>;
  } {
    const builtEdges: GraphEdge[] = [];
    const edgesMap: Map<[string, string], GraphEdge> = new Map();

    const parseWeight = (w: unknown) =>
      Number.isFinite(Number(w)) ? Number(w) : 0;

    edges.forEach((e) => {
      const source = String(e.source);
      const target = String(e.target);
      const builtEdge = {
        source,
        target,
        weight: parseWeight(e.weight),
        ...(e.attributes ? { attributes: e.attributes } : {}),
      };
      builtEdges.push(builtEdge);
      edgesMap.set([source, target], builtEdge);
    });

    return { edges: builtEdges, edgesMap };
  }
}

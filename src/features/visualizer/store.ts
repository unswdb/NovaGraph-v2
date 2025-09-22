import { action, makeObservable, observable, runInAction } from "mobx";
import type { GraphDatabase, GraphEdge, GraphModule, GraphNode } from "./types";
import {
  GRAVITY,
  NODE_SIZE_SCALE,
  type Gravity,
  type NodeSizeScale,
} from "./constant";
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
      setNodes: action,
      setEdges: action,
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
  database: GraphDatabase | null = null;
  databases: GraphDatabase[] = [];
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
    const graph = await this.controller.initGraph();
    runInAction(() => {
      // TODO: Change to controller helper function that retrieves all the database list
      this.databases = [
        {
          label: "Default",
          graph: {
            nodes: graph.nodes.map((n: GraphNode) => ({
              id: String(n.id),
              label: n.label,
              attributes: n.attributes,
            })),
            edges: graph.edges.map((e: GraphEdge) => ({
              source: String(e.source),
              target: String(e.target),
            })),
            directed: graph.directed,
          },
        },
      ];
      this.database = this.databases[0];
    });
  };

  cleanup = () => {
    controller.cleanup();
  };

  setDatabase = (database: GraphDatabase) => {
    this.database = database;
  };

  setNodes = (nodes: GraphNode[]) => {
    this.checkInitialization();
    this.database.graph.nodes = nodes;
    // TODO: save the new database state to kuzu
  };

  setEdges = (edges: GraphEdge[]) => {
    this.checkInitialization();
    this.database.graph.edges = edges;
    // TODO: save the new database state to kuzu
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
}

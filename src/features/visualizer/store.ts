import { action, makeObservable, observable, runInAction } from "mobx";
import createModule from "~/graph";
import type { GraphDatabase, GraphModule } from "./types";
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

export type InitializedVisualizerStore = VisualizerStore & {
  wasmModule: NonNullable<VisualizerStore["wasmModule"]>;
  database: NonNullable<VisualizerStore["database"]>;
};

export default class VisualizerStore {
  // CONSTRUCTORS
  constructor() {
    makeObservable(this, {
      wasmModule: observable,
      database: observable,
      databases: observable,
      gravity: observable,
      nodeSizeScale: observable,
      activeAlgorithm: observable,
      activeResponse: observable,
      initialize: action,
      cleanup: action,
      setDatabase: action,
      addDatabase: action,
      setGravity: action,
      setNodeSizeScale: action,
      setActiveAlgorithm: action,
      setActiveResponse: action,
    });
  }

  // OBSERVABLES
  wasmModule: GraphModule | null = null;
  database: GraphDatabase | null = null;
  databases: GraphDatabase[] = [];
  gravity: Gravity = GRAVITY.ZERO_GRAVITY;
  nodeSizeScale: NodeSizeScale = NODE_SIZE_SCALE.MEDIUM;
  activeAlgorithm: BaseGraphAlgorithm | null = null;
  activeResponse: BaseGraphAlgorithmResult | null = null;

  // ACTIONS
  initialize = async () => {
    const wasmModule = await createModule();
    runInAction(() => {
      this.wasmModule = wasmModule;
      // TODO: Get all graph including default graph
      const graph = this.wasmModule.initGraph();
      this.databases = [
        {
          label: "Default",
          graph: {
            nodes: graph.nodes.map((n: { id: number; name: string }) => ({
              id: String(n.id),
              name: n.name,
            })),
            edges: graph.edges.map((e: { source: number; target: number }) => ({
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
    this.wasmModule?.cleanupGraph();
    this.wasmModule = null;
  };

  setDatabase = (database: GraphDatabase) => {
    this.database = database;
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
    if (!this.wasmModule || !this.database) {
      throw new Error("WASM module is not initialized");
    }
  }
}

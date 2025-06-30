import { action, makeObservable, observable } from "mobx";
import createModule from "~/graph";
import type { GraphEdge, GraphModule, GraphNode } from "./types";

type InitializedVisualizerStore = VisualizerStore & {
  wasmModule: NonNullable<VisualizerStore["wasmModule"]>;
};

export default class VisualizerStore {
  // CONSTRUCTORS
  constructor() {
    makeObservable(this, {
      wasmModule: observable,
      nodes: observable,
      edges: observable,
      initialize: action,
      cleanup: action,
    });
  }

  // OBSERVABLES
  wasmModule: GraphModule | null = null;
  nodes: GraphNode[] = [];
  edges: GraphEdge[] = [];

  // ACTIONS
  async initialize() {
    // Retrieve the WASM module
    const wasmModule = await createModule();
    this.wasmModule = wasmModule;

    // Initialize graph
    const graph = this.wasmModule.initGraph();
    this.nodes = graph.nodes;
    this.edges = graph.edges;
  }

  cleanup() {
    this.wasmModule?.cleanupGraph();
    this.wasmModule = null;
  }

  // UTILITIES FUNCTION
  protected checkInitialization(): asserts this is InitializedVisualizerStore {
    if (!this.wasmModule) {
      throw new Error("WASM module is not initialized");
    }
  }
}

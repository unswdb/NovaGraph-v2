import { action, makeObservable, observable, runInAction } from "mobx";
import createModule from "~/graph";
import type { GraphEdge, GraphModule, GraphNode } from "./visualizer.types";
import { GRAVITY, NODE_SIZE_SCALE, type Gravity, type NodeSizeScale } from "./visualizer.constant";

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
      gravity: observable,
      nodeSizeScale: observable,
      initialize: action,
      cleanup: action,
      setGravity: action,
      setNodeSizeScale: action,
    });
  }

  // OBSERVABLES
  wasmModule: GraphModule | null = null;
  nodes: GraphNode[] = [];
  edges: GraphEdge[] = [];
  gravity: Gravity = GRAVITY.ZERO_GRAVITY;
  nodeSizeScale: NodeSizeScale = NODE_SIZE_SCALE.MEDIUM;

  // ACTIONS
  initialize = async() => {
    // Retrieve the WASM module
    const wasmModule = await createModule();

    runInAction(() => {
      // Initialize graph
      this.wasmModule = wasmModule;
      const graph = this.wasmModule.initGraph();
      // Infered type from src/wasm/generators.cpp
      this.nodes = graph.nodes.map((n: { id: number; name: string }) => ({
        id: String(n.id),
        name: n.name,
      }));
      this.edges = graph.edges.map((e: { source: number; target: number }) => ({
        source: String(e.source),
        target: String(e.target),
      }));
    });
  }

  cleanup = () => {
    this.wasmModule?.cleanupGraph();
    this.wasmModule = null;
  }

  setGravity = (gravity: Gravity) => {
    this.gravity = gravity;
  }

  setNodeSizeScale = (nodeSizeScale: NodeSizeScale) => {
    this.nodeSizeScale = nodeSizeScale;
  }

  // UTILITIES FUNCTION
  protected checkInitialization(): asserts this is InitializedVisualizerStore {
    if (!this.wasmModule) {
      throw new Error("WASM module is not initialized");
    }
  }
}

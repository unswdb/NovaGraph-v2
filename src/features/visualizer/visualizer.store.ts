import { action, makeObservable, observable } from "mobx";
// @ts-expect-error: graph.js has no types yet — replace with proper .d.ts later
import createModule from "~/graph";

type InitializedVisualizerStore = VisualizerStore & {
  k: NonNullable<VisualizerStore["wasmModule"]>;
};

export default class VisualizerStore {
  // CONSTRUCTORS
  constructor() {
    makeObservable(this, {
      wasmModule: observable,
      initialize: action,
      cleanup: action,
    });
  }

  // OBSERVABLES
  wasmModule: unknown = null;

  // ACTIONS
  async initialize() {
    // Retrieve the WASM module
    const wasmModule = await createModule();
    this.wasmModule = wasmModule;

    // Initialize graph
    // const graph = wasmModule.initGraph();
  }

  cleanup() {
    this.wasmModule = null;
  }

  // UTILITIES FUNCTION
  protected checkInitialization(): asserts this is InitializedVisualizerStore {
    if (!this.wasmModule) {
      throw new Error("WASM module is not initialized");
    }
  }
}

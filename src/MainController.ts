import kuzuController from './kuzu/controllers/KuzuController';
import createModule from "./graph";
import type { CompositeType } from './types/KuzuDBTypes';

class MainController {
  // Graph method starts here
  private wasmGraphModule: any = null;

  async getGraphModule() {
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
  async initKuzu(type: string = "inmemory", mode: string = "sync", options: any = {}) {
    return kuzuController.initialize(type, mode);
  }

  // Graph initialization
  async initGraph() {
    const mod = await this.getGraphModule();
    const graph = mod.initGraph();
    return graph;
  }



  // Database operations namespace
  db = {
    async createSchema(
      type: "node" | "rel" | "NODE" | "REL",
      tableName: string,
      primaryKey?: string,
      properties: Record<string, CompositeType> = {},
      relInfo: { from: string; to: string } | null = null
    ) {
      return Promise.resolve(
        kuzuController.createSchema(type, tableName, primaryKey, properties, relInfo)
      );
    },

    async createNode(label: string, properties: Record<string, any> = {}) {
      return Promise.resolve(kuzuController.createNode(label, properties));
    },

    // Execute query method
    async executeQuery(query: string) {
      return Promise.resolve(kuzuController.executeQuery(query));
    }

  };

  algorithms = {

  };


}

// Singleton instance
const controller = new MainController();
export { controller };

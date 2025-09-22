import kuzuController from './kuzu/controllers/KuzuController';
import createModule from "./graph";

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
    // async createSchema(type: string, label: string, properties: any[], relInfo: any = null) {
    //   return Promise.resolve(kuzuController.createSchema(type, label, properties, relInfo));
    // },

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

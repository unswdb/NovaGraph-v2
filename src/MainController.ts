import kuzuController from './kuzu/controllers/KuzuController';
import createModule from "./graph";

class MainController {
  // Graph method starts here
  private wasmGraphModule: any = null;
  private graphState: { nodes: any[], edges: any[] } | null = null;

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

  async initGraph() {
    const mod = await this.getGraphModule();
    const result = mod.initGraph();
    this.graphState = result;
    return result;
  }

  async dijkstra(source: number, target: number) {
    const mod = await this.getGraphModule();
    return mod.dijkstra_source_to_target(source, target);
  }

  // Kuzu method starts here
  async initKuzu(type: string, mode: string, options: any = {}) {
    return kuzuController.initialize(type, mode, options);
  }

  // Get the current service instance
  async getService(): Promise<any> {
    return Promise.resolve(kuzuController.getService());
  }

  // Execute a Cypher query
  async executeQuery(query: string): Promise<any> {
    return Promise.resolve(kuzuController.executeQuery(query));
  }

  // Execute a helper method
  async executeHelper(operation: string, ...args: any[]): Promise<any> {
    return Promise.resolve(kuzuController.executeHelper(operation, ...args));
  }

  // Set up schema
  async setupSchema(schemaStatements: string[]): Promise<any> {
    return Promise.resolve(kuzuController.setupSchema(schemaStatements));
  }

  // Delete all data
  async deleteAllData(): Promise<any> {
    return Promise.resolve(kuzuController.deleteAllData());
  }

  // Clean up resources
  async cleanup(): Promise<any> {
    return Promise.resolve(kuzuController.cleanup());
  }

  // Get available helper functions
  async getHelperFunctions(): Promise<any> {
    return Promise.resolve(kuzuController.getHelperFunctions());
  }


}

// Singleton instance
const controller = new MainController();
export { controller };

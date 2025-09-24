import KuzuInMemorySync from "../services/KuzuInMemorySync";
import KuzuPersistentSync from "../services/KuzuPersistentSync";

class KuzuController {
  constructor() {
    this.service = null;
  }

  /**
   * Initialize Kuzu with specified type and mode
   * @param {string} type - 'inmemory' or 'persistent'
   * @param {string} mode - 'sync' or 'async'
   * @param {Object} options - Additional initialization options
   * @param {string} options.dbPath - Path/name for persistent database
   * @param {Object} options.dbOptions - Database configuration options
   * @returns {Promise<Object>} - The initialized service
   */
  async initialize(type, mode, options = {}) {
    // Cleanup any existing service
    if (this.service) {
      await this.cleanup();
    }

    // Select appropriate service based on type and mode
    const serviceKey = `${type}_${mode}`;
    if (serviceKey === "inmemory_sync") {
      this.service = new KuzuInMemorySync();
      await this.service.initialize();
    } else if (serviceKey === "inmemory_async") {
      throw new Error("In-memory async mode not yet implemented");
    } else if (serviceKey === "persistent_sync") {
      this.service = new KuzuPersistentSync();
      await this.service.initialize();
    } else if (serviceKey === "persistent_async") {
      throw new Error("Persistent async mode not yet implemented");
    } else {
      throw new Error("Invalid Kuzu type or mode");
    }

    return this.service;
  }

  /**
   * Get the current service instance
   * @returns {Object} - The current service
   */
  getService() {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service;
  }

  /**
   * Execute a Cypher query
   * @param {string} query - The Cypher query to execute
   * @returns {Object} Query results
   */
  executeQuery(query) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.executeQuery(query);
  }

  /**
   * Execute a helper method
   * @param {string} operation - The helper method to call
   * @param {...any} args - Arguments to pass to the helper method
   * @returns {Object} Operation results
   */
  executeHelper(operation, ...args) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.executeHelper(operation, ...args);
  }

  /**
   * Set up schema from statements
   * @param {Array<string>} schemaStatements - Schema creation statements
   * @returns {Object} Result of operation
   */
  setupSchema(schemaStatements) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.setupSchema(schemaStatements);
  }

  /**
   * Delete all data
   * @returns {Object} Result of operation
   */
  deleteAllData() {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.deleteAllData();
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.service) {
      await this.service.cleanup();
      this.service = null;
    }
  }

  /**
   * Get available helper functions
   * @returns {Object} List of available helper methods
   */
  getHelperFunctions() {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.getHelperFunctions();
  }

  /**
   * Create a node or relationship schema in the database
   * @param {string} type - "node" or "rel"
   * @param {string} label - Label of the node or relationship
   * @param {Object[]} properties - Array of property definitions, e.g. [{ name: "id", type: "INT", primary: true }]
   * @param {Object} [relInfo] - For relationships only: { fromLabel: string, toLabel: string, direction: "->" | "<-" }
   * @returns {Object} Result of the schema creation query
   */
  createSchema(type, label, properties, relInfo = null) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.createSchema(type, label, properties, relInfo);
  }

  createNode(label, properties) {
    if (!this.service) {
      throw new Error("Kuzu service not initialized");
    }
    return this.service.createNode(label, properties);
  }
}

// Create a singleton instance
// export default const kuzuController = new KuzuController();
// export default KuzuController;

const kuzuController = new KuzuController();
export default kuzuController;
import { getStructuredGraphSnapshot, snapshotGraphState, parseNodesResult, parseEdgesResult } from "./KuzuQueryExecutor"
import { createSchemaQuery } from "../helpers/KuzuQueryBuilder"

export default class KuzuBaseService {
  constructor() {
    this.db = null;
    this.connection = null;
    this.helper = null;
    this.initialized = false;
  }

  getDatabase() {
    return this.db;
  }

  setDatabase(db) {
    this.db = db;
  }

  getConnection() {
    return this.connection;
  }

  setConnection(connection) {
    this.connection = connection;
  }

  getHelper() {
    return this.helper;
  }

  setHelper(helper) {
    this.helper = helper;
  }

  isInitialized() {
    return this.initialized;
  }

  setInitialized(initialized) {
    this.initialized = initialized;
  }


  _isSubGraphResult(result) {
    console.log(result)
    if (!Array.isArray(result.objects) || result.objects.length === 0) {
      if (!Array.isArray(result.objects)) {
        console.log("it is because: !Array.isArray(result.objects")
      }

      if (result.objects.length === 0) {
        console.log("it is because: result.objects.length === 0")
      }

      return false;
    }

    // If array contains a single object with key "result"
    if (
      result.objects.length === 1 &&
      // typeof result.objects[0] === "object" &&
      // result.objects[0] !== null &&
      Object.prototype.hasOwnProperty.call(result.objects[0], "result")
    ) {
      console.log("it is because: result.objects.length === 1 and Object.prototype.hasOwnProperty.call(result.objects[0], result)")
      return false;
    }

    // Otherwise, return true
    return true;
  }

  /**
   * Execute a Cypher query and process the results
   * @param {string} query - The Cypher query to execute
   * @returns {Object} - Query execution result object
   */
  executeQuery(query) {
    if (!this.connection || !query.trim()) {
      return {
        success: false,
        error: "Connection not initialized or empty query",
      };
    }

    try {
      console.log("Executing query:", query);
      let currentResult = this.connection.query(query);

      // Init variable
      const successQueries = [];
      const failedQueries = [];
      let allSuccess = true;
      let nodes = [];
      let edges = [];
      let colorMap = {}; // Add this line

      // Handle result
      while (currentResult) {
        // Process each result individually
        const queryResult = this._processQueryResult(currentResult);
        
        if (queryResult.success) {
          successQueries.push(queryResult);
        } else {
          allSuccess = false;
          failedQueries.push(queryResult);
        }

        // Check if there are more query results
        if (currentResult.hasNextQueryResult()) {
          currentResult = currentResult.getNextQueryResult();
        } else {
          // If it is the last one 
          // figure out the partern of subgraph 
          if (this._isSubGraphResult(queryResult)) {
            // If it return subgraph -> set node and edges to that subgraph
            console.log("It is subgraph chat")

            nodes = parseNodesResult(currentResult);
            edges = parseEdgesResult(currentResult);
            
            // Generate colorMap for subgraph results
            nodes.forEach(node => {
              colorMap[node.id] = 0.8; // Warm color for subgraph nodes
            });
            edges.forEach(edge => {
              colorMap[`${edge.source}-${edge.target}`] = 0.6; // Cool color for subgraph edges
            });
          } else {
            // If it return no -> call getStructured query to get return nodes and edges
            console.log("It is not a subgraph chat")

            const graphState = snapshotGraphState(this.connection); 

            nodes = graphState.nodes;
            edges = graphState.edges;
            
            // No colorMap for whole graph snapshots (neutral colors)
          }
          
          break;
        }
      }

      // Gracefully close the query result object
      currentResult.close();
      console.warn("colorMap:", JSON.stringify(colorMap, null, 2));
      return {
        successQueries: successQueries,
        failedQueries: failedQueries,
        success: allSuccess,
        message: allSuccess
          ? `All queries succeeded`
          : `Some queries failed. Check results for details.`,
        nodes: nodes,
        edges: edges,
        colorMap: colorMap // Add this line
      };
    } catch (err) {
      return {
        success: false,
        error: "Internal executeQuery error: " +  err.message,
      };
    }
  }




  /**
   * Helper method to process a single query result (returns a single object)
   * @private
   * @param {Object} result - A Kuzu query result object
   * @returns {Object} - Standardized result object
   */
  _processQueryResult(result) {
    if (!result.isSuccess()) {
      return {
        success: false,
        object: null,
        message: result.getErrorMessage() || "Query failed - no specified message",
      };
    }

    try {
      const objects = result.getAllObjects();
      return {
        success: result.isSuccess(),
        objects: objects,
        toString: result.toString() // remove in production mode
      };
    } catch (e) {
      return {
        success: false,
        object: null,
        error: "Error processing query result. Error: " + result.getErrorMessage(),
      };
    }
  }

  /**
   * Execute a helper method by name with arguments
   * @param {string} operation - Name of the helper method to execute
   * @param {...any} args - Arguments to pass to the helper method
   * @returns {Object} - Operation result
   */
  executeHelper(operation, ...args) {
    if (!this.helper) {
      return {
        success: false,
        error: "Helper not initialized",
      };
    }

    try {
      console.log(`Executing helper method: ${operation} with args:`, args);

      // Check if the helper has this method
      if (typeof this.helper[operation] !== "function") {
        return {
          success: false,
          error: `Operation '${operation}' not found on helper`,
        };
      }

      // Execute the helper method
      return this.helper[operation](...args);
    } catch (err) {
      console.error(`Error in helper operation ${operation}:`, err);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Set up schema from an array of statements
   * @param {Array<string>} schemaStatements - Schema creation statements
   * @returns {Object} Result of operation
   */
  setupSchema(schemaStatements) {
    try {
      // Execute each schema statement
      for (const statement of schemaStatements) {
        const result = this.executeQuery(statement);
        if (!result.success) {
          return result;
        }
      }
      return {
        success: true,
        message: "Schema created successfully!",
      };
    } catch (err) {
      return {
        success: false,
        error: `Error creating schema: ${err.message}`,
      };
    }
  }

  /**
   * Delete all data from the graph database
   * @returns {Object} Result of operation
   */
  deleteAllData() {
    // First delete relationships, then nodes
    const result1 = this.executeQuery("MATCH ()-[r]-() DELETE r");
    if (!result1.success) {
      return result1;
    }

    const result2 = this.executeQuery("MATCH (n) DELETE n");
    if (!result2.success) {
      return result2;
    }

    return {
      success: true,
      message: "All data deleted successfully",
    };
  }

  /**
   * Get all available helper functions with their descriptions
   * @returns {Object} List of available helper methods
   */
  getHelperFunctions() {
    if (!this.helper) {
      return {
        success: false,
        error: "Helper not initialized",
      };
    }

    try {
      const helperMethods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(this.helper)
      )
        .filter((method) => {
          // Filter out constructor and private methods (starting with _)
          return method !== "constructor" && !method.startsWith("_");
        })
        .map((method) => {
          // Create a description object for each method
          return {
            name: method,
            // You could add parameter info here if you had method metadata
            description: `Helper method: ${method}`,
          };
        });

      return {
        success: true,
        data: helperMethods,
        message: `Found ${helperMethods.length} available helper functions`,
      };
    } catch (err) {
      console.error("Error getting helper functions:", err);
      return {
        success: false,
        error: err.message,
      };
    }
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
    try {
      // Build the query using the function directly
      const query = createSchemaQuery(type, label, properties, relInfo);
      
      // Execute the query using existing executeQuery method
      const result = this.executeQuery(query);
      
      return result;
    } catch (err) {
      return {
        success: false,
        error: `Error creating schema: ${err.message}`,
      };
    }
  }
}

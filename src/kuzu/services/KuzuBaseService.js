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
      const results = [];
      let allSuccessful = true;

      // Process all query results (handles multiple statements in a single query)
      while (currentResult) {
        const queryResult = this._processQueryResult(currentResult);
        results.push(queryResult);

        if (!queryResult.success) {
          allSuccessful = false;
        }

        // Check if there are more query results
        if (currentResult.hasNextQueryResult()) {
          currentResult = currentResult.getNextQueryResult();
        } else {
          break;
        }
      }

      // If only one query was executed, return its result directly
      if (results.length === 1) {
        return results[0];
      }

      // Otherwise return batch results
      return {
        success: allSuccessful,
        batchResults: results,
        message: allSuccessful
          ? `Successfully executed ${results.length} queries`
          : `Some queries failed. Check batchResults for details.`,
      };
    } catch (err) {
      console.error("Error executing query:", err);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Helper method to process a single query result
   * @private
   * @param {Object} result - A Kuzu query result object
   * @returns {Object} - Standardized result object
   */
  _processQueryResult(result) {
    if (!result.isSuccess()) {
      const errorMsg = result.getErrorMessage();
      console.error("Query failed:", errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }

    try {
      if (result.getNumTuples() > 0) {
        const objects = result.getAllObjects();
        const rows = result.getAllRows();
        const summary = result.getQuerySummary();

        return {
          success: true,
          objects: objects,
          rows: rows,
          summary: summary,
          message: `Query operation successful! Found ${objects.length} results.`,
        };
      } else {
        // Handle empty result case
        return {
          success: true,
          objects: [],
          rows: [],
          summary: result.getQuerySummary(),
          message: "Query operation successful! No results found.",
        };
      }
    } catch (e) {
      // This should rarely happen since we check getNumTuples()
      console.error("Error processing query result:", e);
      return {
        success: false,
        error: e.message,
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
}

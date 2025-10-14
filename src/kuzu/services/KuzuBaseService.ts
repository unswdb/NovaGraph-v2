import { snapshotGraphState } from "./KuzuQueryExecutor";

import {
  queryResultColorMapExtraction,
  processQueryResult,
} from "./KuzuQueryResultExtractor";

import {
  createSchemaQuery,
  createNodeQuery,
  findPrimaryKeyQuery,
  deleteNodeQuery,
  getSingleSchemaPropertiesQuery,
  getAllSchemaPropertiesQuery,
  createEdgeSchemaQuery,
  createEdgeQuery,
  createNodeSchemaQuery,
  deleteEdgeQuery,
} from "../helpers/KuzuQueryBuilder";

import type { CompositeType, ValueWithType } from "~/types/KuzuDBTypes";
import type {
  GraphEdge,
  GraphNode,
  GraphSchema,
} from "~/features/visualizer/types";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";

// type QueryResultSync = import("../../types/kuzu-wasm/sync/query_result");

export default class KuzuBaseService {
  protected db: any;
  protected connection: any = null;
  protected helper: any = null;
  protected initialized: boolean = false;

  constructor() {
    this.db = null;
    this.connection = null;
    this.helper = null;
    this.initialized = false;
  }

  snapshotGraphState() {
    return snapshotGraphState(this.connection);
  }

  /**
   * Execute a Cypher query and process the results
   * @param {string} query - The Cypher query to execute
   * @returns {Object} - Query execution result object
   */
  executeQuery(query: string) {
    if (!this.connection || !query.trim()) {
      return {
        success: false,
        error: "Connection not initialized or empty query",
      };
    }

    // Init variable
    const successQueries = [];
    const failedQueries = [];
    let allSuccess = true;
    let colorMap = {};
    let resultType = "graph";

    try {
      let currentResult = this.connection.query(query);

      // Loop through each query result and collect successnesss
      while (currentResult) {
        const queryResult = processQueryResult(currentResult);
        if (queryResult.success) {
          successQueries.push(queryResult);
        } else {
          allSuccess = false;
          failedQueries.push(queryResult);
        }

        // Check last query result
        if (currentResult.hasNextQueryResult()) {
          currentResult = currentResult.getNextQueryResult();
        } else {
          colorMap = queryResultColorMapExtraction(currentResult);
          break;
        }
      }

      // Get snapshot set to nodes and edges
      const { nodes, edges, nodeTables, edgeTables } = snapshotGraphState(
        this.connection
      );

      // Gracefully close the query result object
      currentResult.close();

      return {
        successQueries: successQueries,
        failedQueries: failedQueries,
        success: allSuccess,
        message: allSuccess
          ? `All queries succeeded`
          : `Some queries failed. Check results for details.`,
        nodes: nodes,
        edges: edges,
        nodeTables,
        edgeTables,
        colorMap: colorMap,
        resultType: resultType,
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Internal executeQuery error: " + err.message,
      };
    }
  }

  // /**
  //  * Helper method to process a single query result
  //  *
  //  * @private
  //  * @param {Object} result - A Kuzu query result object
  //  * @returns {Object}
  //  * TODO: in production, remove all toString
  //  */
  // // processQueryResult(result: QueryResultSync) {
  // processQueryResult(result: any) {
  //   if (!result.isSuccess()) {
  //     return {
  //       success: false,
  //       objects: null,
  //       message: result.getErrorMessage() || "Query failed - no specified message",
  //     };
  //   }

  //   try {
  //     const objects = result.getAllObjects();
  //     return {
  //       success: result.isSuccess(),
  //       objects: objects,
  //       toString: result.toString()
  //     };
  //   } catch (e) {
  //     return {
  //       success: false,
  //       objects: null,
  //       error: "Error processing query result. Error: " + result.getErrorMessage(),
  //     };
  //   }
  // }

  // /**
  //  * Execute a helper method by name with arguments
  //  * @param {string} operation - Name of the helper method to execute
  //  * @param {...any} args - Arguments to pass to the helper method
  //  * @returns {Object} - Operation result
  //  */
  // executeHelper(operation: string, ...args) {
  //   if (!this.helper) {
  //     return {
  //       success: false,
  //       error: "Helper not initialized",
  //     };
  //   }

  //   try {
  //     console.log(`Executing helper method: ${operation} with args:`, args);

  //     // Check if the helper has this method
  //     if (typeof this.helper[operation] !== "function") {
  //       return {
  //         success: false,
  //         error: `Operation '${operation}' not found on helper`,
  //       };
  //     }

  //     // Execute the helper method
  //     return this.helper[operation](...args);
  //   } catch (err: any) {
  //     console.error(`Error in helper operation ${operation}:`, err);
  //     return {
  //       success: false,
  //       error: err.message,
  //     };
  //   }
  // }

  // /**
  //  * Set up schema from an array of statements
  //  * @param {Array<string>} schemaStatements - Schema creation statements
  //  * @returns {Object} Result of operation
  //  */
  // setupSchema(schemaStatements: string) {
  //   try {
  //     // Execute each schema statement
  //     for (const statement of schemaStatements) {
  //       const result = this.executeQuery(statement);
  //       if (!result.success) {
  //         return result;
  //       }
  //     }
  //     return {
  //       success: true,
  //       message: "Schema created successfully!",
  //     };
  //   } catch (err) {
  //     return {
  //       success: false,
  //       error: `Error creating schema: ${err.message}`,
  //     };
  //   }
  // }

  // /**
  //  * Delete all data from the graph database
  //  * @returns {Object} Result of operation
  //  */
  // deleteAllData() {
  //   // First delete relationships, then nodes
  //   const result1 = this.executeQuery("MATCH ()-[r]-() DELETE r");
  //   if (!result1.success) {
  //     return result1;
  //   }

  //   const result2 = this.executeQuery("MATCH (n) DELETE n");
  //   if (!result2.success) {
  //     return result2;
  //   }

  //   return {
  //     success: true,
  //     message: "All data deleted successfully",
  //   };
  // }

  // /**
  //  * Get all available helper functions with their descriptions
  //  * @returns {Object} List of available helper methods
  //  */
  // getHelperFunctions() {
  //   if (!this.helper) {
  //     return {
  //       success: false,
  //       error: "Helper not initialized",
  //     };
  //   }

  //   try {
  //     const helperMethods = Object.getOwnPropertyNames(
  //       Object.getPrototypeOf(this.helper)
  //     )
  //       .filter((method) => {
  //         // Filter out constructor and private methods (starting with _)
  //         return method !== "constructor" && !method.startsWith("_");
  //       })
  //       .map((method) => {
  //         // Create a description object for each method
  //         return {
  //           name: method,
  //           // You could add parameter info here if you had method metadata
  //           description: `Helper method: ${method}`,
  //         };
  //       });

  //     return {
  //       success: true,
  //       data: helperMethods,
  //       message: `Found ${helperMethods.length} available helper functions`,
  //     };
  //   } catch (err: any) {
  //     console.error("Error getting helper functions:", err);
  //     return {
  //       success: false,
  //       error: err.message,
  //     };
  //   }
  // }

  /**
   * Create a node or relationship schema in the database.
   *
   * @param type - Either `"node"` or `"rel"`.
   * @param tableName - Label of the node or relationship.
   * @param properties - Array of property definitions.
   * @param relInfo - For relationships only: `{ fromLabel, toLabel, direction }`.
   * @returns Result of the schema creation query.
   */
  createSchema(
    type: "node" | "rel" | "NODE" | "REL",
    tableName: string,
    primaryKey: string | undefined,
    properties: Record<string, CompositeType>,
    relInfo: { from: string; to: string } | null = null
  ) {
    try {
      const query = createSchemaQuery(
        type,
        tableName,
        primaryKey,
        properties,
        relInfo
      );
      return this.executeQuery(query);
    } catch (err: any) {
      return {
        success: false,
        error: `Error creating schema: ${err.message}`,
      };
    }
  }

  createNodeSchema(
    tableName: string,
    primaryKey: string,
    primaryKeyType: PrimaryKeyType,
    properties: {
      name: string;
      type: NonPrimaryKeyType;
      isPrimary?: boolean;
    }[] = [],
    relInfo: { from: string; to: string } | null = null
  ) {
    const query = createNodeSchemaQuery(
      tableName,
      primaryKey,
      primaryKeyType,
      properties,
      relInfo
    );
    const result = this.executeQuery(query);
    if (!result.success) {
      const fq = result.failedQueries?.[0];
      const rawMsg = fq?.message ?? "Unknown error";
      console.error("Failed query (full):", fq);

      let friendlyMsg = rawMsg;
      if (rawMsg.includes("already exists in catalog")) {
        friendlyMsg = `Schema "${tableName}" already exists in the catalog.`;
      }

      // Throw only the friendly/raw message — no prefix here
      throw new Error(friendlyMsg);
    }

    return result;
  }

  createNode(tableName: string, properties: Record<string, ValueWithType>) {
    try {
      // Build the query using the function directly
      const query = createNodeQuery(tableName, properties);

      // Execute the query using existing executeQuery method
      const result = this.executeQuery(query);

      return result;
    } catch (error: any) {
      console.error("Error creating node:", error);
      return {
        success: false,
        error: `Error creating node: ${error.message}`,
      };
    }
  }

  findPrimaryKey(tableName: string) {
    try {
      const query = findPrimaryKeyQuery(tableName);
      const result = this.executeQuery(query);
      return result;
    } catch (error: any) {
      console.error("Error find Primary Key:", error);
      return {
        success: false,
        error: `Error find Primary Key: ${error.message}`,
      };
    }
  }

  /*
  tableName: node.tableName
  primaryKey: string,
  primaryValue: node.label
  */
  deleteNode(node: GraphNode) {
    try {
      const query = deleteNodeQuery(
        node.tableName,
        node._primaryKey,
        node._primaryKeyValue
      );
      const result = this.executeQuery(query);
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: `Error delete Node: ${error.message}`,
      };
    }
  }

  createEdgeSchema(
    tableName: string,
    tablePairs: Array<[string | number, string | number]>,
    properties?: Record<string, CompositeType>,
    relationshipType?: "MANY_ONE" | "ONE_MANY"
  ) {
    try {
      const query = createEdgeSchemaQuery(
        tableName,
        tablePairs,
        properties,
        relationshipType
      );
      const result = this.executeQuery(query);
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: `Error create Edge Schema: ${error.message}`,
      };
    }
  }

  createEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
    weight: number,
    attributes?: Record<string, string | number | boolean>
  ) {
    try {
      const query = createEdgeQuery(node1, node2, edgeTableName, weight, attributes);
      const result = this.executeQuery(query);
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: `Error create Edge: ${error.message}`,
      };
    }
  }

  deleteEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
  ) {
    const query = deleteEdgeQuery(node1, node2, edgeTableName);
    const result = this.executeQuery(query);
    if (!result.success) {
      const fq = result.failedQueries?.[0];
      const rawMsg = fq?.message ?? "Unknown error";
      console.error("deleteEdge Failed query (full):", fq);
      throw new Error(rawMsg);
    }
    return result;
  }

  getAllSchemaProperties() {
    const { nodeTables, edgeTables } = this.snapshotGraphState();
    return { nodeTables, edgeTables };
  }

  getSingleSchemaProperties(tableName: string) {
    const { nodeTables, edgeTables } = this.getAllSchemaProperties();
    const tables = { ...nodeTables, ...edgeTables };
    return tables.find((t) => t.tableName === tableName) ?? null;
  }
}

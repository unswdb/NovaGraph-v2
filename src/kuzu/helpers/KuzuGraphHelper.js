/**
 * KuzuGraphHelper - A collection of helper functions for common Kùzu graph database operations
 *
 * This module provides utility functions to build Cypher queries for common graph operations.
 * Each helper method returns the query results after execution through the connection.
 */

export default class KuzuGraphHelper {
  /**
   * Constructor for the helper class
   * @param {kuzu.Connection} connection - An active Kùzu connection
   */
  constructor(connection) {
    if (!connection) {
      throw new Error("A valid Kùzu connection is required");
    }
    this.connection = connection;
    this.executeQuery = null; // Will be set by the service after initialization
  }

  /**
   * Set the query execution function reference
   * @param {Function} queryExecutor - Function that executes queries
   */
  setQueryExecutor(queryExecutor) {
    if (typeof queryExecutor !== "function") {
      throw new Error("Query executor must be a function");
    }
    this.executeQuery = queryExecutor;
  }

  /**
   * Create a node with the given label and properties
   * @param {string} label - The node label
   * @param {Object} properties - Key-value pairs for node properties
   * @returns {Object} Result of the query
   */
  createNode(label, properties = {}) {
    // Format properties for Cypher
    const propsArray = Object.entries(properties).map(([key, value]) => {
      const formattedValue = typeof value === "string" ? `'${value}'` : value;
      return `${key}: ${formattedValue}`;
    });

    const propsString =
      propsArray.length > 0 ? `{${propsArray.join(", ")}}` : "";
    const query = `CREATE (n:${label} ${propsString}) RETURN n`;

    return this.executeQuery(query);
  }

  /**
   * Create a relationship between two nodes
   * @param {string} fromNodeLabel - Label of the source node
   * @param {Object} fromNodeProps - Properties to identify the source node
   * @param {string} toNodeLabel - Label of the target node
   * @param {Object} toNodeProps - Properties to identify the target node
   * @param {string} relType - Type of relationship
   * @param {Object} relProps - Properties of the relationship
   * @returns {Object} Result of the query
   */
  createRelationship(
    fromNodeLabel,
    fromNodeProps,
    toNodeLabel,
    toNodeProps,
    relType,
    relProps = {}
  ) {
    // Format node property conditions
    const fromConditions = this._formatPropertyConditions(fromNodeProps, "a");
    const toConditions = this._formatPropertyConditions(toNodeProps, "b");

    // Format relationship properties
    const relPropsArray = Object.entries(relProps).map(([key, value]) => {
      const formattedValue = typeof value === "string" ? `'${value}'` : value;
      return `${key}: ${formattedValue}`;
    });

    const relPropsString =
      relPropsArray.length > 0 ? ` {${relPropsArray.join(", ")}}` : "";

    const query = `
          MATCH (a:${fromNodeLabel}), (b:${toNodeLabel})
          WHERE ${fromConditions} AND ${toConditions}
          CREATE (a)-[r:${relType}${relPropsString}]->(b)
          RETURN a, r, b
      `;

    return this.executeQuery(query);
  }

  /**
   * Find nodes by label and optional properties
   * @param {string} label - Node label to search for
   * @param {Object} properties - Optional properties to filter by
   * @param {number} limit - Maximum number of results (0 for unlimited)
   * @returns {Object} Result of the query
   */
  findNodes(label, properties = {}, limit = 100) {
    let whereClause = "";

    if (Object.keys(properties).length > 0) {
      const conditions = this._formatPropertyConditions(properties);
      whereClause = ` WHERE ${conditions}`;
    }

    const limitClause = limit > 0 ? ` LIMIT ${limit}` : "";
    const query = `MATCH (n:${label})${whereClause} RETURN n${limitClause}`;

    return this.executeQuery(query);
  }

  /**
   * Get neighbors of a node
   * @param {string} label - Node label
   * @param {Object} properties - Properties to identify the node
   * @param {string} direction - Direction of relationship ('outgoing', 'incoming', or 'both')
   * @param {string} relType - Optional relationship type filter
   * @returns {Object} Result of the query
   */
  getNeighbors(label, properties, direction = "both", relType = null) {
    const conditions = this._formatPropertyConditions(properties);

    let relationshipPattern;
    if (direction === "outgoing") {
      relationshipPattern = relType ? `-[r:${relType}]->` : "-[r]->";
    } else if (direction === "incoming") {
      relationshipPattern = relType ? `<-[r:${relType}]-` : "<-[r]-";
    } else {
      relationshipPattern = relType ? `-[r:${relType}]-` : "-[r]-";
    }

    const query = `
          MATCH (n:${label})
          WHERE ${conditions}
          MATCH (n)${relationshipPattern}(neighbor)
          RETURN n, r, neighbor
      `;

    return this.executeQuery(query);
  }

  /**
   * Delete nodes by label and properties
   * @param {string} label - Node label
   * @param {Object} properties - Properties to identify nodes to delete
   * @returns {Object} Result of the query
   */
  deleteNodes(label, properties = {}) {
    let whereClause = "";

    if (Object.keys(properties).length > 0) {
      const conditions = this._formatPropertyConditions(properties);
      whereClause = ` WHERE ${conditions}`;
    }

    const query = `MATCH (n:${label})${whereClause} DETACH DELETE n`;

    return this.executeQuery(query);
  }

  /**
   * Update node properties
   * @param {string} label - Node label
   * @param {Object} matchProperties - Properties to identify the node
   * @param {Object} updateProperties - Properties to update
   * @returns {Object} Result of the query
   */
  updateNode(label, matchProperties, updateProperties) {
    const conditions = this._formatPropertyConditions(matchProperties);

    // Format properties for SET clause
    const setItems = Object.entries(updateProperties).map(([key, value]) => {
      const formattedValue = typeof value === "string" ? `'${value}'` : value;
      return `n.${key} = ${formattedValue}`;
    });

    const query = `
          MATCH (n:${label})
          WHERE ${conditions}
          SET ${setItems.join(", ")}
          RETURN n
      `;

    return this.executeQuery(query);
  }

  /**
   * Find nodes with relationships of specific types
   * @param {string} nodeLabel - Node label to start from
   * @param {Array<string>} relationshipTypes - Array of relationship types to search for
   * @param {number} limit - Maximum number of results
   * @returns {Object} Result of the query
   */
  findNodesByRelationships(nodeLabel, relationshipTypes, limit = 100) {
    const relTypePattern = relationshipTypes
      .map((type) => `:${type}`)
      .join("|");

    const query = `
          MATCH (n:${nodeLabel})-[r ${relTypePattern}]-()
          RETURN DISTINCT n
          LIMIT ${limit}
      `;

    return this.executeQuery(query);
  }

  /**
   * Recommend similar nodes based on common relationships
   * @param {string} nodeLabel - Node label
   * @param {Object} nodeProperties - Properties to identify the source node
   * @param {number} limit - Maximum number of recommendations
   * @returns {Object} Result of the query
   */
  recommendSimilarNodes(nodeLabel, nodeProperties, limit = 5) {
    const conditions = this._formatPropertyConditions(nodeProperties);

    const query = `
          MATCH (source:${nodeLabel})-[r1]->(shared)<-[r2]-(similar:${nodeLabel})
          WHERE ${conditions} AND source <> similar
          WITH similar, COUNT(shared) AS commonConnections
          ORDER BY commonConnections DESC
          LIMIT ${limit}
          RETURN similar, commonConnections
      `;

    return this.executeQuery(query);
  }

  /**
   * List all properties of a node
   * @param {string} label - Node label
   * @param {Object} properties - Properties to identify the node
   * @returns {Object} Result with node properties
   */
  listNodeProperties(label, properties) {
    const conditions = this._formatPropertyConditions(properties);

    const query = `
          MATCH (n:${label})
          WHERE ${conditions}
          RETURN n
      `;

    return this.executeQuery(query);
  }

  /**
   * Add properties to a node
   * @param {string} label - Node label
   * @param {Object} matchProperties - Properties to identify the node
   * @param {Object} newProperties - New properties to add
   * @returns {Object} Result of the query
   */
  addNodeProperties(label, matchProperties, newProperties) {
    const conditions = this._formatPropertyConditions(matchProperties);

    const setItems = Object.entries(newProperties).map(([key, value]) => {
      const formattedValue = typeof value === "string" ? `'${value}'` : value;
      return `n.${key} = ${formattedValue}`;
    });

    const query = `
          MATCH (n:${label})
          WHERE ${conditions}
          SET ${setItems.join(", ")}
          RETURN n
      `;

    return this.executeQuery(query);
  }

  /**
   * Remove properties from a node
   * @param {string} label - Node label
   * @param {Object} matchProperties - Properties to identify the node
   * @param {Array<string>} propertyKeys - Keys of properties to remove
   * @returns {Object} Result of the query
   */
  removeNodeProperties(label, matchProperties, propertyKeys) {
    const conditions = this._formatPropertyConditions(matchProperties);

    const removeItems = propertyKeys.map((key) => `n.${key}`);

    const query = `
          MATCH (n:${label})
          WHERE ${conditions}
          REMOVE ${removeItems.join(", ")}
          RETURN n
      `;

    return this.executeQuery(query);
  }

  /**
   * List all properties of a relationship
   * @param {string} fromNodeLabel - Label of the source node
   * @param {Object} fromNodeProps - Properties to identify the source node
   * @param {string} toNodeLabel - Label of the target node
   * @param {Object} toNodeProps - Properties to identify the target node
   * @param {string} relType - Type of relationship
   * @returns {Object} Result with relationship properties
   */
  listRelationshipProperties(
    fromNodeLabel,
    fromNodeProps,
    toNodeLabel,
    toNodeProps,
    relType
  ) {
    const fromConditions = this._formatPropertyConditions(fromNodeProps, "a");
    const toConditions = this._formatPropertyConditions(toNodeProps, "b");

    const query = `
        MATCH (a:${fromNodeLabel})-[r:${relType}]->(b:${toNodeLabel})
        WHERE ${fromConditions} AND ${toConditions}
        RETURN r
    `;

    return this.executeQuery(query);
  }

  /**
   * Update properties of a relationship
   * @param {string} fromNodeLabel - Label of the source node
   * @param {Object} fromNodeProps - Properties to identify the source node
   * @param {string} toNodeLabel - Label of the target node
   * @param {Object} toNodeProps - Properties to identify the target node
   * @param {string} relType - Type of relationship
   * @param {Object} updateProps - Properties to update
   * @returns {Object} Result of the query
   */
  updateRelationshipProperties(
    fromNodeLabel,
    fromNodeProps,
    toNodeLabel,
    toNodeProps,
    relType,
    updateProps
  ) {
    const fromConditions = this._formatPropertyConditions(fromNodeProps, "a");
    const toConditions = this._formatPropertyConditions(toNodeProps, "b");

    const setItems = Object.entries(updateProps).map(([key, value]) => {
      const formattedValue = typeof value === "string" ? `'${value}'` : value;
      return `r.${key} = ${formattedValue}`;
    });

    const query = `
        MATCH (a:${fromNodeLabel})-[r:${relType}]->(b:${toNodeLabel})
        WHERE ${fromConditions} AND ${toConditions}
        SET ${setItems.join(", ")}
        RETURN a, r, b
    `;

    return this.executeQuery(query);
  }

  /**
   * Remove a relationship between nodes
   * @param {string} fromNodeLabel - Label of the source node
   * @param {Object} fromNodeProps - Properties to identify the source node
   * @param {string} toNodeLabel - Label of the target node
   * @param {Object} toNodeProps - Properties to identify the target node
   * @param {string} relType - Type of relationship to remove
   * @returns {Object} Result of the query
   */
  removeRelationship(
    fromNodeLabel,
    fromNodeProps,
    toNodeLabel,
    toNodeProps,
    relType
  ) {
    const fromConditions = this._formatPropertyConditions(fromNodeProps, "a");
    const toConditions = this._formatPropertyConditions(toNodeProps, "b");

    const query = `
        MATCH (a:${fromNodeLabel})-[r:${relType}]->(b:${toNodeLabel})
        WHERE ${fromConditions} AND ${toConditions}
        DELETE r
        RETURN a, b
    `;

    return this.executeQuery(query);
  }

  /**
   * Get all relationships between two nodes
   * @param {string} fromNodeLabel - Label of the source node
   * @param {Object} fromNodeProps - Properties to identify the source node
   * @param {string} toNodeLabel - Label of the target node
   * @param {Object} toNodeProps - Properties to identify the target node
   * @returns {Object} Result with all relationships
   */
  getAllRelationships(fromNodeLabel, fromNodeProps, toNodeLabel, toNodeProps) {
    const fromConditions = this._formatPropertyConditions(fromNodeProps, "a");
    const toConditions = this._formatPropertyConditions(toNodeProps, "b");

    const query = `
        MATCH (a:${fromNodeLabel})-[r]->(b:${toNodeLabel})
        WHERE ${fromConditions} AND ${toConditions}
        RETURN a, r, b
    `;

    return this.executeQuery(query);
  }

  /**
   * List all node labels in the database
   * @returns {Object} Result with all node labels
   */
  listAllNodeLabels() {
    const query = `
          CALL db.nodeLabels() YIELD label
          RETURN label
      `;

    return this.executeQuery(query);
  }

  /**
   * List all relationship types in the database
   * @returns {Object} Result with all relationship types
   */
  listAllRelationshipTypes() {
    const query = `
          CALL db.relationshipTypes() YIELD relType
          RETURN relType
      `;

    return this.executeQuery(query);
  }

  /**
   * Snapshot the current state of the graph (nodes and relationships)
   * @returns {Object} Result with all nodes and relationships
   */
  async snapshotGraphState() {
    const [nodes, edges, tables] = await Promise.all([
      this.executeQuery(`MATCH (n) RETURN n`),
      this.executeQuery(`MATCH ()-[r]->() RETURN r`),
      this.executeQuery(`CALL show_tables() RETURN *`),
    ]);

    return { nodes, edges, tables };
  }

  /**
   * Snapshot the current graph and structure it into node and edge arrays
   * @returns {{ nodes: object[], edges: object[] }} Ready-to-render graph structure
   */
  getStructuredGraphSnapshot() {
    if (!this.connection || !query.trim()) {
      return {
        success: false,
        error: "Connection not initialized or empty query",
      };
    }

    const query = `
      MATCH (n)-[r]->(m)
      RETURN n, r, m
    `;

    const result = this.connection.query(query);

    if (!result || !result.objects) {
      console.warn("No graph data found in snapshot");
      return { nodes: [], edges: [] };
    }

    const nodeMap = new Map();
    const edges = [];

    for (const row of result.objects) {
      const n = row.n;
      const m = row.m;
      const r = row.r;

      // Lamda function to extract props
      const extractProps = (entity, excludeKeys = []) => {
        const props = {};
        for (const key in entity) {
          if (!key.startsWith("_") && !excludeKeys.includes(key)) {
            props[key] = entity[key];
          }
        }
        return props;
      };

      // Parse node 'n'
      if (n?._id?.offset != null) {
        const id = n._id.offset.toString();
        const label = n._label;
        const attributes = extractProps(n, ["id"]);
        nodeMap.set(id, {
          id,
          label,
          ...(Object.keys(attributes).length > 0
            ? { attribute: attributes }
            : {}),
        });
      }

      // Parse node 'm'
      if (m?._id?.offset != null) {
        const id = m._id.offset.toString();
        const label = m._label;
        const attributes = extractProps(m, ["id"]);
        nodeMap.set(id, {
          id,
          label,
          ...(Object.keys(attributes).length > 0
            ? { attribute: attributes }
            : {}),
        });
      }

      // Parse relationship 'r'
      if (r?._id?.offset != null && r._src && r._dst) {
        const attributes = extractProps(r);
        edges.push({
          source: r._src.offset.toString(),
          target: r._dst.offset.toString(),
          ...(Object.keys(attributes).length > 0
            ? { attribute: attributes }
            : {}),
        });
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    };
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
    const propsStr = properties
      .map((prop) => {
        const base = `${prop.name} ${prop.type}`;
        return prop.primary ? `${base} PRIMARY KEY` : base;
      })
      .join(", ");

    let query = "";

    if (type === "node") {
      query = `CREATE NODE TABLE ${label} (${propsStr});`;
    } else if (type === "rel" && relInfo) {
      const { fromLabel, toLabel } = relInfo;
      query = `CREATE REL TABLE ${label} (FROM ${fromLabel} TO ${toLabel}, ${propsStr});`;
    } else {
      throw new Error("Invalid schema definition");
    }

    return this.executeQuery(query);
  }

  /**
   * Helper method to format property conditions for WHERE clauses
   * @private
   * @param {Object} properties - Properties to format as conditions
   * @param {string} nodeVar - Variable name for the node in the query
   * @returns {string} Formatted WHERE clause conditions
   */
  _formatPropertyConditions(properties, nodeVar = "n") {
    if (Object.keys(properties).length === 0) {
      return "1=1"; // Always true if no properties
    }

    return Object.entries(properties)
      .map(([key, value]) => {
        const formattedValue = typeof value === "string" ? `'${value}'` : value;
        return `${nodeVar}.${key} = ${formattedValue}`;
      })
      .join(" AND ");
  }
}

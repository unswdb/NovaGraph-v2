 
  /**
   * Helper method to process a single query result (returns a single object)
   * @private
   * @param {Object} result - A Kuzu query result object
   * @returns {Object} - Standardized result object
   */
  function _processQueryResult(result) {
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
   * Snapshot the current state of the graph (nodes and relationships)
   * @returns {Object} Result with all nodes and relationships
   */
  export function snapshotGraphState(connection) {
    const nodesResult = connection.query(`MATCH (n) RETURN n`);
    const nodes = parseNodesResult(nodesResult);

    const edgesResult = connection.query(`MATCH ()-[r]->() RETURN r`);
    const edges = parseEdgesResult(edgesResult);
    
    
    const tablesResult = connection.query(`CALL show_tables() RETURN *`);
    const tables = _processQueryResult(tablesResult);

    return { nodes, edges, tables };
  }
  
 
 /**
   * Snapshot the current graph and structure it into node and edge arrays
   * @returns {{ nodes: object[], edges: object[] }} Ready-to-render graph structure
   */
export function getStructuredGraphSnapshot(connection) {
    if (!connection) {
      return {
        success: false,
        error: "Connection not initialized or empty query",
      };
    }

    const query = `
      MATCH (n)-[r]->(m)
      RETURN n, r, m
    `;
  
    const result = connection.query(query);
  
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
          ...(Object.keys(attributes).length > 0 ? { attribute: attributes } : {})
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
          ...(Object.keys(attributes).length > 0 ? { attribute: attributes } : {})
        });
      }
  
      // Parse relationship 'r'
      if (r?._id?.offset != null && r._src && r._dst) {
        const attributes = extractProps(r);
        edges.push({
          source: r._src.offset.toString(),
          target: r._dst.offset.toString(),
          ...(Object.keys(attributes).length > 0 ? { attribute: attributes } : {})
        });
      }
    }
  
    return {
      nodes: Array.from(nodeMap.values()),
      edges
    };
  }

/**
 * Parses the result of a node query (MATCH (n) RETURN n) into standardized node objects.
 * @param {Object} result - The Kuzu query result object from connection.query(`MATCH (n) RETURN n`)
 * @returns {Array} Array of nodes with { id, label, attributes? }
 */
export function parseNodesResult(result) {
  if (!result || typeof result.getAllObjects !== 'function') {
    return [];
  }
  const objects = result.getAllObjects();
  console.warn("Raw node objects:", objects);

  const nodes = [];
  for (const obj of objects) {
    // Get the first property value (e.g., obj.n)
    const nodeObj = obj[Object.keys(obj)[0]];
    if (!nodeObj) continue;

    // Accept both _ID/_id and _LABEL/_label for robustness
    const id = nodeObj._ID || nodeObj._id || nodeObj.id || (nodeObj._id && nodeObj._id.offset);
    const label = nodeObj._LABEL || nodeObj._label || nodeObj.label;
    if (id == null || label == null) continue;

    // Extract attributes (all keys except id/label variants and keys starting with _)
    const attributes = {};
    for (const key in nodeObj) {
      if (
        key !== '_ID' && key !== '_id' && key !== 'id' &&
        key !== '_LABEL' && key !== '_label' && key !== 'label' &&
        !key.startsWith('_')
      ) {
        attributes[key] = nodeObj[key];
      }
    }
    const node = {
      id: (typeof id === 'object' && id.offset !== undefined) ? id.offset.toString() : id.toString(),
      label: label.toString(),
      ...(Object.keys(attributes).length > 0 ? { attributes } : {})
    };
    nodes.push(node);
  }
  if (nodes.length === 0) {
    console.warn("uh oh something wrong");
  }
  return nodes;
}

/**
 * Parses the result of an edge query (MATCH ()-[r]->() RETURN r) into standardized edge objects.
 * @param {Object} result - The Kuzu query result object from connection.query(`MATCH ()-[r]->() RETURN r`)
 * @returns {Array} Array of edges with { source, target, label, attributes? }
 */
export function parseEdgesResult(result) {
  if (!result || typeof result.getAllObjects !== 'function') {
    return [];
  }
  const objects = result.getAllObjects();
  console.warn("Raw edge objects:", objects);

  const edges = [];
  for (const obj of objects) {
    // Get the first property value (e.g., obj.r)
    const edgeObj = obj[Object.keys(obj)[0]];
    if (!edgeObj) continue;

    // Extract source, target, label
    const src = edgeObj._SRC || edgeObj._src;
    const dst = edgeObj._DST || edgeObj._dst;
    const label = edgeObj._LABEL || edgeObj._label || edgeObj.label;
    if (!src || !dst || !label) continue;

    // Extract attributes (all keys except id/label/src/dst variants and keys starting with _)
    const attributes = {};
    for (const key in edgeObj) {
      if (
        key !== '_ID' && key !== '_id' && key !== 'id' &&
        key !== '_LABEL' && key !== '_label' && key !== 'label' &&
        key !== '_SRC' && key !== '_src' && key !== 'src' &&
        key !== '_DST' && key !== '_dst' && key !== 'dst' &&
        !key.startsWith('_')
      ) {
        attributes[key] = edgeObj[key];
      }
    }
    const edge = {
      source: (typeof src === 'object' && src.offset !== undefined) ? src.offset.toString() : src.toString(),
      target: (typeof dst === 'object' && dst.offset !== undefined) ? dst.offset.toString() : dst.toString(),
      label: label.toString(),
      ...(Object.keys(attributes).length > 0 ? { attributes } : {})
    };
    edges.push(edge);
  }
  if (edges.length === 0) {
    console.warn("No edges parsed");
  }
  return edges;
}
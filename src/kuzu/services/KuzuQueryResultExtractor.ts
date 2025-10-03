// type QueryResultSync = import("../../types/kuzu-wasm/sync/query_result");

import type { GraphEdge, GraphNode } from "~/features/visualizer/types";
import { findPrimaryKeyQuery, getSingleSchemaPropertiesQuery } from "../helpers/KuzuQueryBuilder";

/**
 * Helper method to process a single query result (returns a single object)
 * @private
 * @param {Object} result - A Kuzu query result object
 * @returns {Object} - Standardized result object
 */
// export function _processQueryResult(result: QueryResultSync) {
export function processQueryResult(result: any) {
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
 * Parses the result of a node query (MATCH (n) RETURN n) into standardized node objects.
 * @param {Object} result - The Kuzu query result object from connection.query(`MATCH (n) RETURN n`)
 * @returns {Array} Array of nodes with { id, label, attributes? }
 */
// export function parseNodesResult(result: QueryResultSync, connection: ConnectionSync) {
export function parseNodesResult(result: any, connection: any) : GraphNode[] {
  if (!result || typeof result.getAllObjects !== 'function') {
    return [];
  }
  const objects = result.getAllObjects();
  const nodes: GraphNode[] = [];

  // Cache check
  let foundTablePrimaryKey: Map<string | number, string | number> = new Map();
  let foundTableProperties: Map<string | number, Set<string>> = new Map();

  for (const obj of objects) {
    // Extract node out and check valid node
    const nodeObj = obj[Object.keys(obj)[0]];
    if (!nodeObj) continue;
    const id = nodeObj._id;
    const tableName = nodeObj._label;
    if (id == null || tableName == null) continue;

    // Find primary key of node
    let primaryKey;
    let tableProperties;

    if (foundTablePrimaryKey.has(tableName)) {
      // if found table name -> retrive 
      primaryKey = foundTablePrimaryKey.get(tableName);
      tableProperties = foundTableProperties.get(tableName);
    } else {
      // if not found table name -> call find primary key, then store
      let schemaReturnObjs = connection.query(getSingleSchemaPropertiesQuery(tableName)).getAllObjects();
      for (const schemaDetail of schemaReturnObjs) {
        if (schemaDetail["primary key"]) {
          primaryKey = schemaDetail["name"];
          foundTablePrimaryKey.set(tableName, primaryKey);
        } else {
          if (!foundTableProperties.has(tableName)) {
            foundTableProperties.set(tableName, new Set());
          }
          foundTableProperties.get(tableName)!.add(schemaDetail["name"]);
        }
      }
    }

    // Extract attributes (all keys except id/label variants and keys starting with _)
    let primaryKeyValue;
    const attributes: Record<string, string | boolean | number> = {};
    for (const key in nodeObj) {
      if (key === primaryKey) {
        primaryKeyValue = nodeObj[key];
      }
      else if (key !== '_id' && key !== '_label' && !key.startsWith('_')) {
        if (foundTableProperties.get(tableName)?.has(key)) {
          attributes[key] = nodeObj[key];
        }
      }
    }
    
    // Format node ID as table_offset
    let nodeId = `${id.table}_${id.offset}`;
    const node: GraphNode = {
      id: nodeId,
      _primaryKey: primaryKey,
      _primaryKeyValue: primaryKeyValue,
      tableName: tableName,
      ...(Object.keys(attributes).length > 0 ? { attributes } : {})
    };
    nodes.push(node);
  }
  return nodes;
}

/**
 * Parses the result of an edge query (MATCH ()-[r]->() RETURN r) into standardized edge objects.
 * @param {Object} result - The Kuzu query result object from connection.query(`MATCH ()-[r]->() RETURN r`)
 * @returns {Array} Array of edges with { source, target, label, attributes? }
 */
// export function parseEdgesResult(result: QueryResultSync) {
export function parseEdgesResult(result: any): GraphEdge[] {
  if (!result || typeof result.getAllObjects !== 'function') {
    return [];
  }
  const objects = result.getAllObjects();
  // console.warn("Raw edge objects:", objects);

  const edges: GraphEdge[] = [];
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
    const attributes: any = {};
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
    
    // Format source and target IDs as table_offset
    let sourceId, targetId;
    if (typeof src === 'object' && src.table !== undefined && src.offset !== undefined) {
      sourceId = `${src.table}_${src.offset}`;
    } else if (typeof src === 'object' && src.offset !== undefined) {
      sourceId = src.offset.toString();
    } else {
      sourceId = src.toString();
    }
    
    if (typeof dst === 'object' && dst.table !== undefined && dst.offset !== undefined) {
      targetId = `${dst.table}_${dst.offset}`;
    } else if (typeof dst === 'object' && dst.offset !== undefined) {
      targetId = dst.offset.toString();
    } else {
      targetId = dst.toString();
    }
    
    const edge: GraphEdge = {
      source: sourceId,
      target: targetId,
      weight: 0,
      // label: label.toString(),
      ...(Object.keys(attributes).length > 0 ? { attributes } : {})
    };
    edges.push(edge);
  }
  return edges;
}

/**
 * Extracts color mapping information from Kuzu query results.
 * Creates a color map for nodes and edges based on their table and offset IDs.
 * 
 * @param {Object} result - The Kuzu query result object from connection.query()
 * @returns {Object} Color map with format:
 *   - Node colors: { "table_offset": colorValue }
 *   - Edge colors: { "sourceId-targetId": colorValue }
 * 
 * @example
 * // Returns: { "0_0": 0.8, "1_0": 0.8, "0_0-1_0": 1 }
 * queryResultExtraction(result)
 * 
 * @throws {Error} When result object is invalid or missing required methods
 * @returns {Object} Color map or error object with error message
 */
// export function queryResultColorMapExtraction(result: QueryResultSync) {
export function queryResultColorMapExtraction(result: any) {
  if (!result || typeof result.getAllObjects !== 'function') {
    console.warn("Invalid result object - missing getAllObjects method");
    return { nodes: [], edges: [] };
  }

  const colorMap: any = {};
  // console.warn("Processing query result for color mapping");
  try {
    const objects = result.getAllObjects();
    
    for (const obj of objects) {
      // console.log(obj);

      for (let i = 0; i < Object.keys(obj).length; i++) {
        let entity = obj[Object.keys(obj)[i]]; 
    
        // Entity structure examples:
        // Node: {_id, _label, ...} - has _id, _label, but no _src/_dst
        // Edge: {_id, _label, _src, _dst, ...} - has _id, _label, _src, _dst

        if (entity) {
          // If it is node
          if (entity._id && entity._label && !entity._src && !entity._dst) {
            const nodeId = `${entity._id.table}_${entity._id.offset}`;
            colorMap[nodeId] = 0.8;
          } 
          // If it is edge
          else if (entity._id && entity._label && entity._src && entity._dst) {
            const sourceId = `${entity._src.table}_${entity._src.offset}`;
            const targetId = `${entity._dst.table}_${entity._dst.offset}`;
            colorMap[`${sourceId}-${targetId}`] = 1;
          } 
          else {
            console.log("Unrecognized entity type - skipping");
          }
        }
      }
      
    }
  } catch (err: any) {
    return {
      error: "Internal queryResultExtraction error: " +  err.message,
    }
  }
  return colorMap;
}


// export function queryResultNodesAndEdgesExtraction(result) {
//   // if (!result || !result.objects) {
//   //     console.log(result.isSuccess());
//   //     console.log(result.toString());

//   //     console.warn("No graph data found");
//   //     return { nodes: [], edges: [] };
//   // }

//   const nodeMap = new Map();
//   const edges = [];

//   for (const row of result.objects) {
//     const n = row.n;
//     const m = row.m;
//     const r = row.r;

//     // Lamda function to extract props
//     const extractProps = (entity, excludeKeys = []) => {
//       const props = {};
//       for (const key in entity) {
//         if (!key.startsWith("_") && !excludeKeys.includes(key)) {
//           props[key] = entity[key];
//         }
//       }
//       return props;
//     };

//     // Parse node 'n'
//     if (n?._id?.offset != null) {
//       const id = n._id.offset.toString();
//       const label = n._label;
//       const attributes = extractProps(n, ["id"]);
//       nodeMap.set(id, {
//         id,
//         label,
//         ...(Object.keys(attributes).length > 0 ? { attribute: attributes } : {})
//       });
//     }

//     // Parse node 'm'
//     if (m?._id?.offset != null) {
//       const id = m._id.offset.toString();
//       const label = m._label;
//       const attributes = extractProps(m, ["id"]);
//       nodeMap.set(id, {
//         id,
//         label,
//         ...(Object.keys(attributes).length > 0 ? { attribute: attributes } : {})
//       });
//     }

//     // Parse relationship 'r'
//     if (r?._id?.offset != null && r._src && r._dst) {
//       const attributes = extractProps(r);
//       edges.push({
//         source: r._src.offset.toString(),
//         target: r._dst.offset.toString(),
//         ...(Object.keys(attributes).length > 0 ? { attribute: attributes } : {})
//       });
//     }
//   }

//   return {
//     nodes: Array.from(nodeMap.values()),
//     edges
//   };
// }
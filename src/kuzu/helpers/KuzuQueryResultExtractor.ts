import type QueryResult from "../types/kuzu_wasm_internal/query_result";

import { getSingleSchemaPropertiesQuery } from "./KuzuQueryBuilder";
import type {
  ErrorQueryResult,
  SuccessQueryResult,
} from "./KuzuQueryResultExtractor.types";

import type {
  GraphEdge,
  GraphNode,
  GraphSchema,
} from "~/features/visualizer/types";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { ColorMap } from "~/igraph/types";

/**
 * Helper method to process a single query result (returns a single object)
 * @private
 * @param {Object} result - A Kuzu query result object
 * @returns {Object} - Standardized result object
 */
export function processQueryResult(
  result: QueryResult
): SuccessQueryResult | ErrorQueryResult {
  if (!result.isSuccess()) {
    return {
      success: false,
      message:
        result.getErrorMessage() || "Query failed - no specified message",
    };
  }

  try {
    const objects = result.getAllObjects();
    return {
      success: true,
      objects: objects,
    };
  } catch (err) {
    return {
      success: false,
      message:
        result.getErrorMessage() || "Query failed - no specified message",
    };
  }
}

export function parseTablesResult(
  result: any
): Pick<GraphSchema, "tableName" | "tableType">[] {
  if (!result || typeof result.getAllObjects !== "function") {
    return [];
  }

  const objects = result.getAllObjects();
  const tables = [];

  for (const obj of objects) {
    tables.push({
      tableName: obj.name,
      tableType: obj.type,
    });
  }

  return tables;
}

export function parseSingleTableResult(
  result: any
): Omit<GraphSchema, "tableName" | "tableType"> | null {
  if (!result || typeof result.getAllObjects !== "function") {
    return null;
  }
  if (!result.isSuccess()) {
    throw new Error("parseSingleTableResult encounters an error");
  }
  const objects = result.getAllObjects();
  if (!objects) return null;

  let tableProps = {
    primaryKey: "",
    primaryKeyType: "NULL" as PrimaryKeyType,
    properties: {} as Record<string, NonPrimaryKeyType>,
  };

  for (const obj of objects) {
    if (obj["primary key"]) {
      tableProps.primaryKey = obj.name;
      tableProps.primaryKeyType = obj.type as PrimaryKeyType;
    } else {
      tableProps.properties[obj.name] = obj.type as NonPrimaryKeyType;
    }
  }

  return tableProps;
}

export function parseTableConnection(
  result: any
): { sourceTableName: string; targetTableName: PrimaryKeyType } | null {
  if (!result || typeof result.getAllObjects !== "function") {
    return null;
  }
  if (!result.isSuccess()) {
    throw new Error("parseTableConnection encounters an error");
  }
  const objects = result.getAllObjects();
  if (!objects) return null;

  let tableProps = {
    sourceTableName: "",
    targetTableName: "NULL" as PrimaryKeyType,
  };

  for (const obj of objects) {
    tableProps.sourceTableName = obj["source table name"];
    tableProps.targetTableName = obj["destination table name"];
  }

  return tableProps;
}

/**
 * Parses the result of a node query (MATCH (n) RETURN n) into standardized node objects.
 * @param {Object} result - The Kuzu query result object from connection.query(`MATCH (n) RETURN n`)
 * @returns {Array} Array of nodes with { id, label, attributes? }
 */
// export function parseNodesResult(result: QueryResultSync, connection: ConnectionSync) {
export function parseNodesResult(result: any, connection: any): GraphNode[] {
  if (!result || typeof result.getAllObjects !== "function") {
    return [];
  }
  const objects = result.getAllObjects();
  const nodes: GraphNode[] = [];

  // Cache check
  let foundTablePrimaryKey: Map<string | number, string | number> = new Map();
  let foundTableProperties: Map<string | number, Set<string>> = new Map();

  console.log("Inside parse Node")
  console.log(objects)
  console.log("Inside parse Node")

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
      let schemaReturnObjs = connection
        .query(getSingleSchemaPropertiesQuery(tableName))
        .getAllObjects();
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

    // Extract attributes (all keys except _id/_label internal structure)
    let primaryKeyValue;
    const attributes: Record<string, PrimaryKeyType> = {};
    for (const key in nodeObj) {
      if (key === primaryKey) {
        primaryKeyValue = nodeObj[key];
      } else if (key !== "_id" && key !== "_label") {
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
      ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
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
  if (!result || typeof result.getAllObjects !== "function") {
    return [];
  }
  const objects = result.getAllObjects();
  const edges: GraphEdge[] = [];
  for (const obj of objects) {
    // Get the first property value (e.g., obj.r)
    const edgeObj = obj[Object.keys(obj)[0]];
    if (!edgeObj) continue;

    // Extract internal source, target, label
    const src = edgeObj._src;
    const dst = edgeObj._dst;
    const label = edgeObj._label;
    if (!src || !dst || !label) continue;

    // Extract attributes except internal attributes
    const attributes: any = {};
    for (const key in edgeObj) {
      if (
        key !== "_id" &&
        key !== "_label" &&
        key !== "_src" &&
        key !== "_dst"
      ) {
        attributes[key] = edgeObj[key];
      }
    }

    // Format source and target IDs as table_offset
    let sourceId, targetId;
    if (
      typeof src === "object" &&
      src.table !== undefined &&
      src.offset !== undefined
    ) {
      sourceId = `${src.table}_${src.offset}`;
    } else if (typeof src === "object" && src.offset !== undefined) {
      sourceId = src.offset.toString();
    } else {
      sourceId = src.toString();
    }

    if (
      typeof dst === "object" &&
      dst.table !== undefined &&
      dst.offset !== undefined
    ) {
      targetId = `${dst.table}_${dst.offset}`;
    } else if (typeof dst === "object" && dst.offset !== undefined) {
      targetId = dst.offset.toString();
    } else {
      targetId = dst.toString();
    }

    const edge: GraphEdge = {
      source: sourceId,
      target: targetId,
      tableName: label.toString(),
      ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
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
  if (!result || typeof result.getAllObjects !== "function") {
    return {};
  }

  const colorMap: ColorMap = {};
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
        }
      }
    }
  } catch (err: any) {
    return {};
  }
  return colorMap;
}

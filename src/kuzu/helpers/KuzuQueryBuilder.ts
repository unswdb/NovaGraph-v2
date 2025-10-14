/**
 * KuzuQueryBuilder - A collection of query construction functions for Kùzu graph database operations
 *
 * This module provides pure query construction functions without any database dependencies.
 * Each function returns a Cypher query string that can be executed by any query executor.
 */

import type { GraphNode } from "~/features/visualizer/types";
import type {
  CompositeType,
  ScalarType,
  ValueWithType,
} from "../../types/KuzuDBTypes";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { InputChangeResult } from "~/features/visualizer/inputs";

export function createEdgeQuery(
  node1: GraphNode,
  node2: GraphNode,
  edgeTableName: string,
  weight: number,
  attributes?: Record<string, string | number | boolean>
) {
  const allAttributes = { weight, ...(attributes ?? {}) };

  const propString =
    allAttributes && Object.keys(allAttributes).length > 0
      ? `{ ${Object.entries(allAttributes)
          .map(([key, value]) =>
            typeof value === "string"
              ? `${key}: "${value}"`
              : `${key}: ${value}`
          )
          .join(", ")} }`
      : "";

  const query = `
  MATCH (u1:\`${node1.tableName}\`), (u2:\`${node2.tableName}\`)
  WHERE u1.\`${node1._primaryKey}\` = "${node1._primaryKeyValue}"
    AND u2.\`${node2._primaryKey}\` = "${node2._primaryKeyValue}"
  CREATE (u1)-[:\`${edgeTableName}\` ${propString}]->(u2);
  `;

  console.log("Query: " + query);
  return query;
}

export function deleteEdgeQuery(
  edgeTableName: string,
  node1: GraphNode,
  node2: GraphNode
) {
  const query = `MATCH (u:\`${node1.tableName}\`)-[f:\`${edgeTableName}\`]->(u1:\`${node2.tableName}\`)
WHERE u.\`${node1._primaryKey}\` = '${node1._primaryKeyValue}' AND u1.\`${node2._primaryKey}\` = '${node2._primaryKeyValue}'
DELETE f;
`;
  return query;
}

export function updateEdgeQuery(
  node1: GraphNode, 
  node2: GraphNode,
  edgeTableName: string,
  values: Record<string, InputChangeResult<any>>
) {

  console.log("Here\n")

  for (let obj in values) {
    console.log(obj)
  }

  let query = `
  MATCH (u0:${node1.tableName})-[f:${edgeTableName}]->(u1:${node2.tableName})
  WHERE u0.nam\`${node1._primaryKey}\` = \`${node1._primaryKeyValue}\` AND u1.\`${node2._primaryKey}\` = \`${node1._primaryKeyValue}\`
  SET f.since = 2012
  RETURN f;
  `
  // console.log(query)
} 



export function createEdgeSchemaQuery(
  tableName: string,
  tablePairs: Array<[string | number, string | number]>, // Cant use record because of allowing dup
  properties?: Record<string, CompositeType>,
  relationshipType?: "MANY_ONE" | "ONE_MANY"
): string {
  // Build the FROM...TO parts
  const pairParts = tablePairs.map(([fromTable, toTable]) => {
    return `FROM \`${fromTable}\` TO \`${toTable}\``;
  });

  // Build property parts (if any)
  const propParts =
    properties && Object.keys(properties).length > 0
      ? Object.entries(properties).map(([name, type]) => `\`${name}\` ${type}`)
      : [];

  // Add relationshipType at the end (if provided)
  const tailParts = relationshipType ? [relationshipType] : [];

  const inner = [...pairParts, ...propParts, ...tailParts].join(", ");
  const query = `CREATE REL TABLE \`${tableName}\` (${inner});`;

  // console.log("create edge table query:", query);
  return query;
}

/**
 * Generates a Cypher DDL query string for creating a simple node table.
 *
 * This function builds a `CREATE NODE TABLE` statement for defining a node schema
 * with basic scalar property types (e.g., STRING, INT, DOUBLE, BOOLEAN, DATE, etc.).
 * Complex composite types such as DECIMAL, LIST, STRUCT, MAP, or UNION are intentionally
 * not supported in this simplified version.
 *
 * @param tableName - The name of the node table to create.
 * @param primaryKey - The property name to use as the table's primary key.
 * @param primaryKeyType - The data type of the primary key (e.g., STRING, INT).
 * @param properties - Optional additional properties for the node, as key–type pairs.
 * @param _relInfo - Reserved for compatibility with the original function signature; unused here.
 *
 * @returns A formatted Cypher DDL string that creates a node table with the given schema.
 *
 * @example
 * ```ts
 * createNodeSchemaQuery("Person", "name", "STRING", {
 *   age: "INT",
 *   alive: "BOOLEAN"
 * });
 * // → CREATE NODE TABLE Person (name STRING, age INT, alive BOOLEAN, PRIMARY KEY (name));
 * ```
 */
export function createNodeSchemaQuery(
  tableName: string,
  primaryKey: string,
  primaryKeyType: PrimaryKeyType,
  properties: {
    name: string;
    type: NonPrimaryKeyType;
    isPrimary?: boolean;
  }[] = [],
  _relInfo: { from: string; to: string } | null = null
): string {
  const qid = (s: string) => `\`${String(s).replace(/`/g, "``")}\``;

  const typeToDDL = (t: NonPrimaryKeyType): string => {
    if (typeof t === "string") return t; // types stay raw, e.g., STRING, INT, DATE
    return String(t as any);
  };

  const cols: string[] = [
    `${qid(primaryKey)} ${typeToDDL(primaryKeyType)}`,
    ...properties
      .filter((f) => f.name !== primaryKey)
      .map((f) => `${qid(f.name)} ${typeToDDL(f.type)}`),
  ];

  const query = `CREATE NODE TABLE ${qid(tableName)} (${cols.join(
    ", "
  )}, PRIMARY KEY (${qid(primaryKey)}));`;
  // console.warn(query)
  return query;
}

/**
 * Builds a Cypher DDL query string for creating a node or relationship table in Kùzu.
 *
 * Thin bridge: formats schema definitions into `CREATE TABLE` syntax.
 * Leaves validation to the database engine.
 *
 * @param type - Either `"node"` or `"rel"`.
 * @param label - Name of the table.
 * @param primaryKey - Node tables only: column to use as PRIMARY KEY.
 *                      + Legal PK types: INT, INT8, INT16, INT32, INT64, INT128,
 *                     UINT8, UINT16, UINT32, UINT64, FLOAT, DOUBLE, DECIMAL,
 *                     UUID, STRING, DATE, TIMESTAMP, BLOB, SERIAL.
 *                      + Illegal PK types: BOOLEAN, NULL, INTERVAL, JSON.
 * @param properties - Column name → `CompositeType` (scalars, STRUCT, LIST, MAP, UNION, etc).
 * @param relInfo - Rel tables only: `{ from, to }` node labels.
 *
 * @returns Cypher `CREATE NODE TABLE …` or `CREATE REL TABLE …` string.
 *
 * @example
 * // Node with STRING PK
 * createSchemaQuery("node", "Person", "name", { name: "STRING", age: "INT" });
 * // -> CREATE NODE TABLE Person(name STRING, age INT, PRIMARY KEY (name));
 *
 * @example
 * // Rel between Person → Person
 * createSchemaQuery("rel", "KNOWS", undefined, { since: "DATE" }, { from: "Person", to: "Person" });
 * // -> CREATE REL TABLE KNOWS (FROM Person TO Person, since DATE);
 */

export function createSchemaQuery(
  type: "node" | "rel" | "NODE" | "REL",
  label: string,
  primaryKey: string | undefined,
  properties: Record<string, CompositeType>,
  relInfo: { from: string; to: string } | null = null
): string {
  const kind = type.toLowerCase() as "node" | "rel";

  const typeToDDL = (t: CompositeType): string => {
    if (typeof t === "string") return t;
    switch (t.kind) {
      case "DECIMAL":
        return `DECIMAL(${t.precision},${t.scale})`;
      case "LIST":
      case "ARRAY":
        return `LIST(${typeToDDL(t.of)})`;
      case "STRUCT":
        return `STRUCT(${Object.entries(t.fields)
          .map(([k, v]) => `${k} ${typeToDDL(v)}`)
          .join(", ")})`;
      case "MAP":
        return `MAP(${t.key},${typeToDDL(t.value)})`;
      case "UNION":
        return `UNION(${Object.entries(t.variants)
          .map(([tag, v]) => `${tag}: ${typeToDDL(v)}`)
          .join(", ")})`;
      default:
        return String(t as any);
    }
  };

  const cols = Object.entries(properties).map(
    ([name, spec]) => `${name} ${typeToDDL(spec)}`
  );

  if (kind === "node") {
    const pkClause = primaryKey ? `, PRIMARY KEY (${primaryKey})` : "";
    return `CREATE NODE TABLE ${label} (${cols.join(", ")}${pkClause});`;
  } else {
    if (!relInfo) {
      throw new Error(`Relationship "${label}" requires relInfo { from, to }`);
    }
    return cols.length
      ? `CREATE REL TABLE ${label} (FROM ${relInfo.from} TO ${
          relInfo.to
        }, ${cols.join(", ")});`
      : `CREATE REL TABLE ${label} (FROM ${relInfo.from} TO ${relInfo.to});`;
  }
}

/**
 * Create a node with the given label and properties
 * @param tableName - The node label
 * @param properties - Key-value pairs for node properties
 * @returns Result of the query
 */
export function createNodeQuery(
  tableName: string,
  properties: Record<string, ValueWithType>
): string {
  const entries = Object.entries(properties)
    .map(([key, [type, value]]) => `${key}: ${_serialize(type, value)}`)
    .join(", ");
  const q = `CREATE (n:${tableName} {${entries}});`;
  // console.log('createNodeQuery:', q);
  return q;
}

export function findPrimaryKeyQuery(tableName: string) {
  return `CALL TABLE_INFO('${tableName}') WHERE \`primary key\` = true RETURN name;`;
}
/**
 * Builds a Cypher query to delete a node (and all its relationships) by primary key.
 *
 * @param tableName - Node label (table) to match.
 * @param primaryKey - Property name used as primary key.
 * @param primaryValue - Primary key value. Supported types:
 *   INT, UINT, FLOAT, DOUBLE, DECIMAL, SERIAL,
 *   STRING, UUID, DATE, TIMESTAMP, BLOB.
 *   (Booleans/JSON not allowed as primary keys.)
 *
 * @returns Cypher `MATCH … DETACH DELETE` query string.
 */
export function deleteNodeQuery(
  tableName: string,
  primaryKey: string,
  primaryValue: any
) {
  const query = `MATCH (n:\`${tableName}\`) WHERE n.\`${primaryKey}\` = "${primaryValue}" DETACH DELETE n`;
  return query;
}

/**
 * Builds a Cypher query to retrieve the primary key column name
 * of a given table in Kùzu.
 *
 * @param tableName - The name of the table to inspect.
 * @returns Query string selecting the primary key column.
 */
export function findPrimaryKeyForNodeQuery(tableName: string) {
  const query = `CALL TABLE_INFO('${tableName}') WHERE \`primary key\` = true RETURN name;`;
  return query;
}

/**
 * Builds a Cypher query to retrieve all properties(columns name and its corresponding data type)
 * of a given table in Kùzu.
 *
 * @param tableName - The name of the table to inspect.
 * @returns Query string selecting name, type, primary key
 */
export function getSingleSchemaPropertiesQuery(tableName: string) {
  const query = `CALL TABLE_INFO('${tableName}') RETURN *;`;
  return query;
}

/**
 * Builds a Cypher query to retrieve all properties(columns name and its corresponding data type)
 * of a given table in Kùzu.
 *
 * @param tableName - The name of the table to inspect.
 * @returns Query string selecting name, type, primary key
 */
export function getAllSchemaPropertiesQuery() {
  const query = `CALL show_tables() RETURN name, type;`;
  return query;
}

// Helper function down here
/**
 * Escape special characters in a string for safe use in query literals.
 *
 * @param s - The raw input string.
 * @returns The escaped string with backslashes and quotes properly escaped.
 *
 * @example
 * _esc('He said "hi"'); // "He said \"hi\""
 */
function _esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Converts a value to a number and validates that it is finite.
 *
 * @param type - The value to convert.
 * @param value - Context string for error messages (e.g., the expected type).
 * @returns The numeric value if valid.
 * @throws Will throw if the value cannot be converted to a finite number.
 *
 * @example
 * _ensureNumber("INT32", "42"); // 42
 * _ensureNumber("INT32", "abc", ); // throws Error
 */
function _ensureNumber(type: string, value: any): number {
  const n = Number(value);
  if (!Number.isFinite(n))
    throw new Error(`${type}: expected finite number, got ${value}`);
  return n;
}

/**
 * Serializes scalar values using the scalar type name.
 * @param type - Scalar DB type (e.g., 'INT32', 'STRING', 'UUID').
 * @param value - Value to serialize.
 */
function _serializeScalar(type: ScalarType, value: any): string {
  switch (type) {
    case "INT":
    case "INT8":
    case "INT16":
    case "INT32":
    case "INT64":
    case "INT128":
    case "UINT8":
    case "UINT16":
    case "UINT32":
    case "UINT64":
      // Todo: test
      return String(_ensureNumber(type, value));

    case "FLOAT":
    case "DOUBLE":
      // Todo: test
      return String(_ensureNumber(type, value));

    case "BOOLEAN":
      // Todo: test
      return value ? "true" : "false";

    case "STRING":
      return `"${_esc(String(value))}"`;

    case "UUID":
      return `uuid("${_esc(String(value))}")`;

    case "DATE":
      // Todo: test
      return `date("${_esc(String(value))}")`;

    case "TIMESTAMP":
      // Todo: test
      return `timestamp("${_esc(String(value))}")`;

    case "INTERVAL":
      // Todo: test
      return `interval("${_esc(String(value))}")`;

    case "BLOB":
      // Todo: implement
      throw new Error(
        "BLOB serialization not implemented yet. Consider base64 + blob() wrapper."
      );

    case "JSON":
      // Todo: implement
      return `json("${_esc(JSON.stringify(value))}")`;

    case "SERIAL":
      // Todo: implement
      return String(_ensureNumber(type, value));

    case "NULL":
      return "null";

    default:
      throw new Error(`Unknown scalar type: ${type}`);
  }
}

/**
 * Serializes a JavaScript value into a query string literal
 * according to its database type specification.
 *
 * Supports scalars (e.g., STRING, INT, BOOLEAN, UUID) and STRUCTs.
 * Other complex types (LIST, MAP, UNION, etc.) may throw until implemented.
 *
 * @param type - The CompositeType describing how the value should be serialized.
 * @param value - The runtime JavaScript value to serialize.
 * @returns A string representation of the value suitable for embedding in a query.
 * @throws Will throw if the value does not match the expected spec.
 *
 * @example
 * _serialize("STRING", "Tom");  // "\"Tom\""
 * _serialize("INT32", 123);     // "123"
 * _serialize("UUID", "123e4567-e89b-12d3-a456-426614174000");
 * // -> 'uuid("123e4567-e89b-12d3-a456-426614174000")'
 */
function _serialize(type: CompositeType, value: any): string {
  if (value === null) return "null";

  if (typeof type === "string") {
    return _serializeScalar(type, value);
  }

  if (type.kind === "STRUCT") {
    const obj = value ?? {};
    const parts: string[] = [];
    for (const [k, fieldSpec] of Object.entries(type.fields)) {
      if (obj[k] === undefined) continue; // allow missing optionals
      // type first, value later
      parts.push(`${k}: ${_serialize(fieldSpec, obj[k])}`);
    }
    return `{${parts.join(", ")}}`;
  }

  // Todo: test
  if (type.kind === "DECIMAL") {
    return String(
      _ensureNumber(`DECIMAL(${type.precision},${type.scale})`, value)
    );
  }

  // Todo: implement
  if (type.kind === "LIST" || type.kind === "ARRAY") {
    if (!Array.isArray(value)) throw new Error(`${type.kind} expects an array`);
    throw new Error(`${type.kind} serialization not implemented yet`);
  }

  if (type.kind === "MAP") {
    throw new Error("MAP serialization not implemented yet");
  }

  if (type.kind === "UNION") {
    throw new Error("UNION serialization not implemented yet");
  }

  if (
    type.kind === "NODE" ||
    type.kind === "REL" ||
    type.kind === "RECURSIVE_REL"
  ) {
    throw new Error(`${type.kind} is not a serializable property literal`);
  }

  throw new Error(`Unsupported CompositeType: ${JSON.stringify(type)}`);
}

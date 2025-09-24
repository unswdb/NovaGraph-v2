/**
 * KuzuQueryBuilder - A collection of query construction functions for Kùzu graph database operations
 * 
 * This module provides pure query construction functions without any database dependencies.
 * Each function returns a Cypher query string that can be executed by any query executor.
 */

import type {
  CompositeType,
  ScalarType,
  ValueWithType
} from '../../types/KuzuDBTypes'

/**
 * Create a node or relationship schema query
 * @param type - "node" or "rel"
 * @param label - Label of the node or relationship
 * @param properties - Array of property definitions
 * @param relInfo - For relationships only: { fromLabel: string, toLabel: string, direction: "->" | "<-" }
 * @returns Cypher query string for schema creation
 */
export function createSchemaQuery(
  type: string,
  label: string,
  properties: Array<{ name: string; type: string; primary?: boolean; structFields?: Array<{ name: string; type: string }> }>,
  relInfo: { fromLabel: string; toLabel: string; direction: "->" | "<-" } | null = null
) {
  const propsStr = properties
    .map((prop) => {
      if (prop.type.toUpperCase() === "STRUCT") {
        if (!prop.structFields || prop.structFields.length === 0) {
          throw new Error(`STRUCT property "${prop.name}" must have structFields defined`);
        }

        // Build inline struct field definition: STRUCT(field1 TYPE, field2 TYPE, ...)
        const structDef = prop.structFields
          .map((field) => `${field.name} ${field.type}`)
          .join(", ");

        return `${prop.name} STRUCT(${structDef})`;
      }

      // Normal primitive property
      const base = `${prop.name} ${prop.type}`;
      return prop.primary ? `${base} PRIMARY KEY` : base;
    })
    .join(", ");

  let query = "";

  if (type === "node") {
    query = `CREATE NODE TABLE ${label} (${propsStr});`;
  } else if (type === "rel" && relInfo) {
    const { fromLabel, toLabel } = relInfo;
    if (propsStr !== "") {
      query = `CREATE REL TABLE ${label} (FROM ${fromLabel} TO ${toLabel}, ${propsStr});`;
    } else {
      query = `CREATE REL TABLE ${label} (FROM ${fromLabel} TO ${toLabel});`;
    }
  } else {
    throw new Error("Invalid schema definition");
  }

  console.log("createSchemaQuery: " + query);
  return query;
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
    .join(', ');
  const q = `CREATE (n:${tableName} {${entries}});`;
  console.log('createNodeQuery:', q);
  return q;
}


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
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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
  if (!Number.isFinite(n)) throw new Error(`${type}: expected finite number, got ${value}`);
  return n;
}


/**
 * Serializes scalar values using the scalar type name.
 * @param type - Scalar DB type (e.g., 'INT32', 'STRING', 'UUID').
 * @param value - Value to serialize.
 */
function _serializeScalar(type: ScalarType, value: any): string {
  switch (type) {
    case 'INT': case 'INT8': case 'INT16': case 'INT32': case 'INT64': case 'INT128':
    case 'UINT8': case 'UINT16': case 'UINT32': case 'UINT64':
      return String(_ensureNumber(type, value));

    case 'FLOAT': case 'DOUBLE':
      return String(_ensureNumber(type, value));

    case 'BOOLEAN':
      return value ? 'true' : 'false';

    case 'STRING':
      return `"${_esc(String(value))}"`;

    case 'UUID':
      return `uuid("${_esc(String(value))}")`;

    case 'DATE':
      return `date("${_esc(String(value))}")`;

    case 'TIMESTAMP':
      return `timestamp("${_esc(String(value))}")`;

    case 'INTERVAL':
      return `interval("${_esc(String(value))}")`;

    case 'BLOB':
      throw new Error('BLOB serialization not implemented yet. Consider base64 + blob() wrapper.');

    case 'JSON':
      return `json("${_esc(JSON.stringify(value))}")`;

    case 'SERIAL':
      return String(_ensureNumber(type, value));

    case 'NULL':
      return 'null';

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
  if (value === null) return 'null';

  if (typeof type === 'string') {
    return _serializeScalar(type, value);
  }

  if (type.kind === 'DECIMAL') {
    // ctx first, value second
    return String(_ensureNumber(`DECIMAL(${type.precision},${type.scale})`, value));
  }

  if (type.kind === 'STRUCT') {
    const obj = value ?? {};
    const parts: string[] = [];
    for (const [k, fieldSpec] of Object.entries(type.fields)) {
      if (obj[k] === undefined) continue; // allow missing optionals
      // type first, value later
      parts.push(`${k}: ${_serialize(fieldSpec, obj[k])}`);
    }
    return `{${parts.join(', ')}}`;
  }

  if (type.kind === 'LIST' || type.kind === 'ARRAY') {
    if (!Array.isArray(value)) throw new Error(`${type.kind} expects an array`);
    throw new Error(`${type.kind} serialization not implemented yet`);
  }

  if (type.kind === 'MAP') {
    throw new Error('MAP serialization not implemented yet');
  }

  if (type.kind === 'UNION') {
    throw new Error('UNION serialization not implemented yet');
  }

  if (type.kind === 'NODE' || type.kind === 'REL' || type.kind === 'RECURSIVE_REL') {
    throw new Error(`${type.kind} is not a serializable property literal`);
  }

  throw new Error(`Unsupported CompositeType: ${JSON.stringify(type)}`);
}

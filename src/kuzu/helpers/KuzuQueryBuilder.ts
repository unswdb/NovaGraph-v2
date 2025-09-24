/**
 * KuzuQueryBuilder - A collection of query construction functions for Kùzu graph database operations
 * 
 * This module provides pure query construction functions without any database dependencies.
 * Each function returns a Cypher query string that can be executed by any query executor.
 */

import type {
  TypeSpec,
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
 * @param label - The node label
 * @param properties - Key-value pairs for node properties
 * @returns Result of the query
 */
export function createNodeQuery(
  tableName: string,
  typedProps: Record<string, ValueWithType>
): string {
  const entries = Object.entries(typedProps)
    .map(([key, [spec, val]]) => `${key}: ${_serialize(val, spec)}`)
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
 * @param x - The value to convert.
 * @param ctx - Context string for error messages (e.g., the expected type).
 * @returns The numeric value if valid.
 * @throws Will throw if the value cannot be converted to a finite number.
 *
 * @example
 * _ensureNumber("42", "INT32"); // 42
 * _ensureNumber("abc", "INT32"); // throws Error
 */
function _ensureNumber(x: any, ctx: string): number {
  const n = Number(x);
  if (!Number.isFinite(n)) throw new Error(`${ctx}: expected finite number, got ${x}`);
  return n;
}

/**
 * Serializes a JavaScript value into a query string literal
 * according to its database type specification.
 *
 * Supports scalars (e.g., STRING, INT, BOOLEAN, UUID) and STRUCTs.
 * Other complex types (LIST, MAP, UNION, etc.) may throw until implemented.
 *
 * @param value - The runtime JavaScript value to serialize.
 * @param spec - The TypeSpec describing how the value should be serialized.
 * @returns A string representation of the value suitable for embedding in a query.
 * @throws Will throw if the value does not match the expected spec.
 *
 * @example
 * _serialize("Tom", "STRING");  // "\"Tom\""
 * _serialize(123, "INT32");     // "123"
 * _serialize("123e4567-e89b-12d3-a456-426614174000", "UUID");
 * // -> 'uuid("123e4567-e89b-12d3-a456-426614174000")'
 */
function _serialize(value: any, spec: TypeSpec): string {
  if (value === null) {
    // explicit NULL type or any nullable position
    return 'null';
  }

  if (typeof spec === 'string') {
    switch (spec) {
      case 'INT': case 'INT8': case 'INT16': case 'INT32': case 'INT64': case 'INT128':
      case 'UINT8': case 'UINT16': case 'UINT32': case 'UINT64':
        return String(_ensureNumber(value, spec));
      case 'FLOAT': case 'DOUBLE':
        return String(_ensureNumber(value, spec));
      case 'BOOLEAN':
        return value ? 'true' : 'false';
      case 'STRING':
        return `"${_esc(String(value))}"`;
      case 'UUID':
        return `uuid("${_esc(String(value))}")`;
      // Todo: test from those down throughoutly
      case 'DATE':
        return `date("${_esc(String(value))}")`;
      case 'TIMESTAMP':
        return `timestamp("${_esc(String(value))}")`;
      case 'INTERVAL':
        return `interval("${_esc(String(value))}")`;
      case 'BLOB':
      // Todo: implement first 
        throw new Error('BLOB serialization not implemented yet. Consider base64 and a blob() wrapper if supported.');
      case 'JSON':
        return `json("${_esc(JSON.stringify(value))}")`; // or just JSON string if your DB expects raw JSON
      case 'SERIAL':
        return String(_ensureNumber(value, spec));
      case 'NULL':
        return 'null';
      default:
        // Never here
        throw new Error(`Unknown scalar type: ${spec}`);
    }
  }

  if (spec.kind === 'DECIMAL') {
    // Todo: test throughoutly 
    return String(_ensureNumber(value, `DECIMAL(${spec.precision},${spec.scale})`));
  }

  if (spec.kind === 'STRUCT') {
    const obj = value ?? {};
    const parts: string[] = [];
    for (const [k, fieldSpec] of Object.entries(spec.fields)) {
      // Allow missing optional fields: skip if undefined
      if (obj[k] === undefined) continue;
      parts.push(`${k}: ${_serialize(obj[k], fieldSpec)}`);
    }
    return `{${parts.join(', ')}}`;
  }

  // Todo: implement those then test throughoutly  
  if (spec.kind === 'LIST' || spec.kind === 'ARRAY') {
    if (!Array.isArray(value)) throw new Error(`${spec.kind} expects an array`);
    throw new Error(`${spec.kind} serialization not implemented yet`);
  }

  if (spec.kind === 'MAP') {
    throw new Error('MAP serialization not implemented yet');
  }

  if (spec.kind === 'UNION') {
    // Common pattern: { tag: 'VariantName', value: ... } or { VariantName: payload }
    throw new Error('UNION serialization not implemented yet');
  }

  // --- Graph handles (typically appear in query results, not property literals) ---
  if (spec.kind === 'NODE' || spec.kind === 'REL' || spec.kind === 'RECURSIVE_REL') {
    throw new Error(`${spec.kind} is not a serializable property literal`);
  }

  throw new Error(`Unsupported TypeSpec: ${JSON.stringify(spec)}`);
}

/**
 * KuzuQueryBuilder - A collection of query construction functions for Kùzu graph database operations
 * 
 * This module provides pure query construction functions without any database dependencies.
 * Each function returns a Cypher query string that can be executed by any query executor.
 */

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
// 1) Type system
type ScalarType =
  | 'STRING' | 'INT' | 'DOUBLE' | 'BOOLEAN'
  | 'UUID' | 'DATE' | 'TIMESTAMP' | 'INTERVAL';

type TypeSpec =
  | ScalarType
  | { kind: 'STRUCT'; fields: Record<string, TypeSpec> }
  | { kind: 'LIST'; of: TypeSpec };

type PrimitiveValue = string | number | boolean | null;
type NestedValue = PrimitiveValue | NestedValue[] | { [k: string]: NestedValue };
type ValueWithType = [TypeSpec, NestedValue];

function esc(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function serialize(value: any, spec: TypeSpec): string {
  if (value === null) return 'null';

  if (typeof spec === 'string') {
    switch (spec) {
      case 'UUID':       return `uuid("${esc(String(value))}")`;
      case 'DATE':       return `date("${esc(String(value))}")`;
      case 'TIMESTAMP':  return `timestamp("${esc(String(value))}")`;
      case 'INTERVAL':   return `interval("${esc(String(value))}")`;
      case 'BOOLEAN':    return value ? 'true' : 'false';
      case 'INT':
      case 'DOUBLE':     return `${Number(value)}`;
      case 'STRING':
      default:           return `"${esc(String(value))}"`;
    }
  }

  if (spec.kind === 'LIST') {
    if (!Array.isArray(value)) throw new Error('LIST expects an array');
    return `[${value.map(v => serialize(v, spec.of)).join(', ')}]`;
  }

  if (spec.kind === 'STRUCT') {
    const parts = Object.entries(spec.fields).map(([k, fs]) => {
      return `${k}: ${serialize(value?.[k], fs)}`;
    });
    return `{${parts.join(', ')}}`;
  }

  throw new Error('Unsupported TypeSpec');
}

export function createNodeQuery(
  tableName: string,
  typedProps: Record<string, ValueWithType>
): string {
  const entries = Object.entries(typedProps)
    .map(([key, [spec, val]]) => `${key}: ${serialize(val, spec)}`)
    .join(', ');
  const q = `CREATE (n:${tableName} {${entries}});`;
  console.log('createNodeQueryTyped:', q);
  return q;
}

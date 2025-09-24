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
// Primitives supported for now
type PrimitiveValue = string | number | boolean | null;

// NestedValue can be a primitive, array of nested values, or an object (STRUCT)
type NestedValue = PrimitiveValue | NestedValue[] | { [key: string]: NestedValue };

function _serializeValue(value: NestedValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") return `${value}`;
  if (Array.isArray(value)) return `[${value.map(_serializeValue).join(", ")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, v]) => `${key}: ${_serializeValue(v)}`)
      .join(", ");
    return `{${entries}}`;
  }
  throw new Error("Unsupported type");
}


export function createNodeQuery(
  tableName: string,
  props: { [key: string]: NestedValue }
): string {
  const entries = Object.entries(props)
    .map(([key, value]) => `${key}: ${_serializeValue(value)}`)
    .join(", ");


  console.log("createNodeQuery: " + `CREATE (n:${tableName} {${entries}});`)
  return `CREATE (n:${tableName} {${entries}});`;
}

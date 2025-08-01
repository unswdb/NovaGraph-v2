/**
 * KuzuQueryBuilder - A collection of query construction functions for Kùzu graph database operations
 * 
 * This module provides pure query construction functions without any database dependencies.
 * Each function returns a Cypher query string that can be executed by any query executor.
 */

/**
 * Create a node or relationship schema query
 * @param {string} type - "node" or "rel"
 * @param {string} label - Label of the node or relationship
 * @param {Object[]} properties - Array of property definitions, e.g. [{ name: "id", type: "INT", primary: true }]
 * @param {Object} [relInfo] - For relationships only: { fromLabel: string, toLabel: string, direction: "->" | "<-" }
 * @returns {string} Cypher query string for schema creation
 */
export function createSchemaQuery(type, label, properties, relInfo = null) {
  const propsStr = properties.map(prop => {
    const base = `${prop.name} ${prop.type}`;
    return prop.primary ? `${base} PRIMARY KEY` : base;
  }).join(', ');

  let query = '';

  if (type === 'node') {
    query = `CREATE NODE TABLE ${label} (${propsStr});`;
  } else if (type === 'rel' && relInfo) {
    const { fromLabel, toLabel } = relInfo;
    query = `CREATE REL TABLE ${label} (FROM ${fromLabel} TO ${toLabel}, ${propsStr});`;
  } else {
    throw new Error('Invalid schema definition');
  }

  return query;
} 
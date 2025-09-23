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
 * @param properties - Array of property definitions, e.g. [{ name: "id", type: "INT", primary: true }]
 * @param relInfo - For relationships only: { fromLabel: string, toLabel: string, direction: "->" | "<-" }
 * @returns Cypher query string for schema creation
 */
export function createSchemaQuery(type: string, label: string, properties: Array<{name: string, type: string, primary?: boolean}>, relInfo: {fromLabel: string, toLabel: string, direction: "->" | "<-"} | null = null) {
  const propsStr = properties.map(prop => {
    const base = `${prop.name} ${prop.type}`;
    return prop.primary ? `${base} PRIMARY KEY` : base;
  }).join(', ');

  let query = '';

  if (type === 'node') {
    query = `CREATE NODE TABLE ${label} (${propsStr});`;
  } else if (type === 'rel' && relInfo) {
    const { fromLabel, toLabel } = relInfo;
    if (propsStr !== '') {
      query = `CREATE REL TABLE ${label} (FROM ${fromLabel} TO ${toLabel}, ${propsStr});`;
    } else {
      query = `CREATE REL TABLE ${label} (FROM ${fromLabel} TO ${toLabel});`;
    }
  } else {
    throw new Error('Invalid schema definition');
  }

  return query;
} 


/**
 * Create a node with the given label and properties
 * @param label - The node label
 * @param properties - Key-value pairs for node properties
 * @returns Result of the query
 */
export function createNodeQuery(label: string, properties: Record<string, any> = {}) {
  // Format properties for Cypher
  const propsArray = Object.entries(properties).map(([key, value]) => {
    const formattedValue = typeof value === 'string' ? `'${value}'` : value;
    return `${key}: ${formattedValue}`;
  });
  
  const propsString = propsArray.length > 0 ? `{${propsArray.join(', ')}}` : '';
  const query = `CREATE (n:${label} ${propsString}) RETURN n`;
  
  return query;
}
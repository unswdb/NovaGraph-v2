import { 
  _processQueryResult, 
  parseNodesResult, 
  parseEdgesResult 
} from './KuzuQueryResultExtractor.js';

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
  

import { 
  processQueryResult, 
  parseNodesResult, 
  parseEdgesResult 
} from './KuzuQueryResultExtractor';

// type ConnectionSync = import("../../types/kuzu-wasm/sync/connection");

/**
   * Snapshot the current state of the graph (nodes and relationships)
   * @returns {Object} Result with all nodes and relationships
   */
  // export function snapshotGraphState(connection: ConnectionSync) {
  export function snapshotGraphState(connection: any) {

    const nodesResult = connection.query(`MATCH (n) RETURN n`);
    const nodes = parseNodesResult(nodesResult, connection);

    const edgesResult = connection.query(`MATCH ()-[r]->() RETURN r`);
    const edges = parseEdgesResult(edgesResult);
    
    
    const tablesResult = connection.query(`CALL show_tables() RETURN *`);
    const tables = processQueryResult(tablesResult);

    return { nodes, edges, tables };
  }
  
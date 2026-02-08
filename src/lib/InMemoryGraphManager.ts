import type {
  EdgeSchema,
  GraphEdge,
  GraphNode,
  GraphSnapshotState,
  NodeSchema,
} from "~/features/visualizer/types";
import type {
  PrimaryKeyType,
  NonPrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { InputChangeResult } from "~/features/visualizer/inputs";

/**
 * InMemoryGraphManager - Manages graph data directly in memory without kuzu
 * This provides better performance for non-persistent graphs by bypassing the kuzu layer
 */
export class InMemoryGraphManager {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  private nodeTables: NodeSchema[] = [];
  private edgeTables: EdgeSchema[] = [];
  private directed: boolean = true;
  private nodeIdCounter: number = 0;

  constructor(directed: boolean = true) {
    this.directed = directed;
  }

  /**
   * Get current graph direction
   */
  getGraphDirection(): boolean {
    return this.directed;
  }

  /**
   * Set graph direction
   */
  setGraphDirection(directed: boolean): void {
    this.directed = directed;
  }

  /**
   * Generate a unique node ID
   */
  private generateNodeId(): string {
    return `node_${this.nodeIdCounter++}_${Date.now()}`;
  }

  /**
   * Create a node schema
   */
  createNodeSchema(
    tableName: string,
    primaryKey: string,
    primaryKeyType: PrimaryKeyType,
    properties: { name: string; type: NonPrimaryKeyType }[] = []
  ): void {
    // Check if schema already exists
    if (this.nodeTables.find((t) => t.tableName === tableName)) {
      throw new Error(`Node table ${tableName} already exists`);
    }

    const schema: NodeSchema = {
      tableName,
      tableType: "NODE",
      primaryKey,
      primaryKeyType,
      properties: properties.reduce((acc, prop) => {
        acc[prop.name] = prop.type;
        return acc;
      }, {} as Record<string, NonPrimaryKeyType>),
    };

    this.nodeTables.push(schema);
  }

  /**
   * Create an edge schema
   */
  createEdgeSchema(
    tableName: string,
    tablePairs: Array<[string | number, string | number]>,
    properties: (
      | { name: string; type: NonPrimaryKeyType }
      | { name: string; type: PrimaryKeyType }
    )[],
    relationshipType?: "MANY_ONE" | "ONE_MANY" | "MANY_MANY" | "ONE_ONE"
  ): void {
    // Check if schema already exists
    if (this.edgeTables.find((t) => t.tableName === tableName)) {
      throw new Error(`Edge table ${tableName} already exists`);
    }

    // For simplicity, use the first table pair
    const [sourceTable, targetTable] = tablePairs[0];
    const sourceTableName = String(sourceTable);
    const targetTableName = String(targetTable);

    const schema: EdgeSchema = {
      tableName,
      tableType: "REL",
      primaryKey: "", // Edges don't have primary keys in our system
      primaryKeyType: "STRING",
      sourceTableName,
      targetTableName,
      properties: properties.reduce((acc, prop) => {
        acc[prop.name] = prop.type;
        return acc;
      }, {} as Record<string, NonPrimaryKeyType>),
    };

    this.edgeTables.push(schema);
  }

  /**
   * Create a node
   */
  createNode(
    label: string,
    properties: Record<string, { value: any; success?: boolean; message?: string }>
  ): GraphSnapshotState {
    const schema = this.nodeTables.find((t) => t.tableName === label);
    if (!schema) {
      throw new Error(`Node table ${label} does not exist`);
    }

    const primaryKeyValue = properties[schema.primaryKey]?.value;
    if (primaryKeyValue === undefined || primaryKeyValue === null) {
      throw new Error(`Primary key ${schema.primaryKey} is required`);
    }

    // Check if node with same primary key already exists
    const existingNode = this.nodes.find(
      (n) => n.tableName === label && n._primaryKeyValue === primaryKeyValue
    );
    if (existingNode) {
      throw new Error(
        `Node with primary key ${primaryKeyValue} already exists in table ${label}`
      );
    }

    const nodeId = this.generateNodeId();
    const attributes: Record<string, any> = {};

    // Extract attributes (excluding primary key)
    for (const [key, val] of Object.entries(properties)) {
      if (key !== schema.primaryKey && val.value !== undefined && val.value !== null) {
        attributes[key] = val.value;
      }
    }

    const node: GraphNode = {
      id: nodeId,
      _primaryKey: schema.primaryKey,
      _primaryKeyValue: primaryKeyValue,
      tableName: label,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    };

    this.nodes.push(node);
    return this.snapshotGraphState();
  }

  /**
   * Update a node
   */
  updateNode(
    node: GraphNode,
    values: Record<string, InputChangeResult<any>>
  ): GraphSnapshotState {
    const index = this.nodes.findIndex((n) => n.id === node.id);
    if (index === -1) {
      throw new Error(`Node ${node.id} not found`);
    }

    const updatedNode = { ...this.nodes[index] };
    const attributes = { ...(updatedNode.attributes || {}) };

    for (const [key, val] of Object.entries(values)) {
      if (val.value !== undefined && val.value !== null) {
        if (key === updatedNode._primaryKey) {
          updatedNode._primaryKeyValue = val.value;
        } else {
          attributes[key] = val.value;
        }
      }
    }

    updatedNode.attributes = Object.keys(attributes).length > 0 ? attributes : undefined;
    this.nodes[index] = updatedNode;

    return this.snapshotGraphState();
  }

  /**
   * Delete a node
   */
  deleteNode(node: GraphNode): GraphSnapshotState {
    // Remove node
    this.nodes = this.nodes.filter((n) => n.id !== node.id);

    // Remove all edges connected to this node
    this.edges = this.edges.filter(
      (e) => e.source !== node.id && e.target !== node.id
    );

    return this.snapshotGraphState();
  }

  /**
   * Create an edge
   */
  createEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTable: EdgeSchema,
    attributes?: Record<string, InputChangeResult<any>>
  ): GraphSnapshotState {
    // Canonicalize for undirected graphs
    let source = node1.id;
    let target = node2.id;

    if (!this.directed) {
      // For undirected graphs, ensure canonical order
      const [canonSource, canonTarget] =
        node1.id <= node2.id ? [node1.id, node2.id] : [node2.id, node1.id];
      source = canonSource;
      target = canonTarget;
    }

    // Check if edge already exists
    const existingEdge = this.edges.find(
      (e) => e.source === source && e.target === target && e.tableName === edgeTable.tableName
    );
    if (existingEdge) {
      throw new Error(`Edge already exists between ${source} and ${target}`);
    }

    const edgeAttributes: Record<string, any> = {};
    if (attributes) {
      for (const [key, val] of Object.entries(attributes)) {
        if (val.value !== undefined && val.value !== null) {
          edgeAttributes[key] = val.value;
        }
      }
    }

    const edge: GraphEdge = {
      source,
      target,
      tableName: edgeTable.tableName,
      attributes: Object.keys(edgeAttributes).length > 0 ? edgeAttributes : undefined,
    };

    this.edges.push(edge);
    return this.snapshotGraphState();
  }

  /**
   * Delete an edge
   */
  deleteEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string
  ): GraphSnapshotState {
    let source = node1.id;
    let target = node2.id;

    if (!this.directed) {
      // For undirected graphs, check both directions
      const [canonSource, canonTarget] =
        node1.id <= node2.id ? [node1.id, node2.id] : [node2.id, node1.id];
      source = canonSource;
      target = canonTarget;
    }

    this.edges = this.edges.filter(
      (e) => !(e.source === source && e.target === target && e.tableName === edgeTableName)
    );

    return this.snapshotGraphState();
  }

  /**
   * Update an edge
   */
  updateEdge(
    node1: GraphNode,
    node2: GraphNode,
    edgeTableName: string,
    values: Record<string, InputChangeResult<any>>
  ): GraphSnapshotState {
    let source = node1.id;
    let target = node2.id;

    if (!this.directed) {
      const [canonSource, canonTarget] =
        node1.id <= node2.id ? [node1.id, node2.id] : [node2.id, node1.id];
      source = canonSource;
      target = canonTarget;
    }

    const index = this.edges.findIndex(
      (e) => e.source === source && e.target === target && e.tableName === edgeTableName
    );
    if (index === -1) {
      throw new Error(`Edge not found`);
    }

    const updatedEdge = { ...this.edges[index] };
    const attributes = { ...(updatedEdge.attributes || {}) };

    for (const [key, val] of Object.entries(values)) {
      if (val.value !== undefined && val.value !== null) {
        attributes[key] = val.value;
      }
    }

    updatedEdge.attributes = Object.keys(attributes).length > 0 ? attributes : undefined;
    this.edges[index] = updatedEdge;

    return this.snapshotGraphState();
  }

  /**
   * Import from CSV
   */
  async importFromCSV(
    nodesText: string,
    edgesText: string,
    nodeTableName: string,
    edgeTableName: string,
    isDirected: boolean
  ): Promise<GraphSnapshotState> {
    this.directed = isDirected;

    // Parse nodes CSV
    const nodesLines = nodesText.trim().split("\n");
    if (nodesLines.length < 2) {
      throw new Error("Nodes CSV must have at least a header and one row");
    }

    const nodeHeader = nodesLines[0].trim();
    const nodeColumns = nodeHeader.split(",").map((col) => col.trim());
    const primaryKeyColumn = nodeColumns[0];

    // Infer types from first data row
    const firstDataRow = nodesLines[1].split(",").map((col) => col.trim());
    const nodeTypes: Record<string, NonPrimaryKeyType> = {};
    for (let i = 1; i < nodeColumns.length; i++) {
      const value = firstDataRow[i];
      nodeTypes[nodeColumns[i]] = this.inferType(value);
    }

    // Create node schema
    const primaryKeyType = this.inferType(firstDataRow[0]) as PrimaryKeyType;
    const nodeProperties = nodeColumns.slice(1).map((col) => ({
      name: col,
      type: nodeTypes[col] || "STRING",
    }));

    this.createNodeSchema(nodeTableName, primaryKeyColumn, primaryKeyType, nodeProperties);

    // Create nodes
    for (let i = 1; i < nodesLines.length; i++) {
      const values = nodesLines[i].split(",").map((col) => col.trim());
      const properties: Record<string, { value: any }> = {};
      for (let j = 0; j < nodeColumns.length; j++) {
        properties[nodeColumns[j]] = { value: this.parseValue(values[j], nodeTypes[nodeColumns[j]] || "STRING") };
      }
      this.createNode(nodeTableName, properties);
    }

    // Parse edges CSV
    const edgesLines = edgesText.trim().split("\n");
    if (edgesLines.length < 2) {
      throw new Error("Edges CSV must have at least a header and one row");
    }

    const edgeHeader = edgesLines[0].trim();
    const edgeColumns = edgeHeader.split(",").map((col) => col.trim());

    if (!edgeColumns.includes("source") || !edgeColumns.includes("target")) {
      throw new Error("Edges CSV must have 'source' and 'target' columns");
    }

    const sourceIdx = edgeColumns.indexOf("source");
    const targetIdx = edgeColumns.indexOf("target");
    const edgeAttributeColumns = edgeColumns.filter(
      (col) => col !== "source" && col !== "target"
    );

    // Infer edge attribute types
    const firstEdgeRow = edgesLines[1].split(",").map((col) => col.trim());
    const edgeTypes: Record<string, NonPrimaryKeyType> = {};
    for (const col of edgeAttributeColumns) {
      const colIdx = edgeColumns.indexOf(col);
      if (colIdx >= 0 && colIdx < firstEdgeRow.length) {
        edgeTypes[col] = this.inferType(firstEdgeRow[colIdx]);
      }
    }

    // Create edge schema
    const edgeProperties = edgeAttributeColumns.map((col) => ({
      name: col,
      type: edgeTypes[col] || "STRING",
    }));

    this.createEdgeSchema(
      edgeTableName,
      [[nodeTableName, nodeTableName]],
      edgeProperties
    );

    // Create edges
    const nodeMap = new Map<string, GraphNode>();
    for (const node of this.nodes) {
      const key = `${node.tableName}::${node._primaryKeyValue}`;
      nodeMap.set(key, node);
    }

    for (let i = 1; i < edgesLines.length; i++) {
      const values = edgesLines[i].split(",").map((col) => col.trim());
      const sourceKey = values[sourceIdx];
      const targetKey = values[targetIdx];

      const sourceNode = nodeMap.get(`${nodeTableName}::${sourceKey}`);
      const targetNode = nodeMap.get(`${nodeTableName}::${targetKey}`);

      if (!sourceNode || !targetNode) {
        console.warn(`Skipping edge: source or target node not found`);
        continue;
      }

      const attributes: Record<string, InputChangeResult<any>> = {};
      for (const col of edgeAttributeColumns) {
        const colIdx = edgeColumns.indexOf(col);
        if (colIdx >= 0 && colIdx < values.length) {
          attributes[col] = {
            value: this.parseValue(values[colIdx], edgeTypes[col] || "STRING"),
          };
        }
      }

      try {
        this.createEdge(sourceNode, targetNode, this.edgeTables.find((t) => t.tableName === edgeTableName)!, attributes);
      } catch (err) {
        // Skip duplicate edges
        console.warn(`Skipping duplicate edge: ${sourceKey} -> ${targetKey}`);
      }
    }

    return this.snapshotGraphState();
  }

  /**
   * Import from JSON
   */
  async importFromJSON(
    nodesText: string,
    edgesText: string,
    nodeTableName: string,
    edgeTableName: string,
    isDirected: boolean
  ): Promise<GraphSnapshotState> {
    this.directed = isDirected;

    // Parse nodes JSON
    const nodesData = JSON.parse(nodesText);
    if (!Array.isArray(nodesData) || nodesData.length === 0) {
      throw new Error("Nodes JSON must contain at least one object");
    }

    const firstNode = nodesData[0];
    const nodeKeys = Object.keys(firstNode);
    if (nodeKeys.length === 0) {
      throw new Error("Node objects must have at least one property");
    }

    const primaryKeyColumn = nodeKeys[0];
    const nodeAttributeKeys = nodeKeys.slice(1);

    // Infer types
    const primaryKeyType = this.inferType(firstNode[primaryKeyColumn]) as PrimaryKeyType;
    const nodeProperties = nodeAttributeKeys.map((key) => ({
      name: key,
      type: this.inferType(firstNode[key]),
    }));

    this.createNodeSchema(nodeTableName, primaryKeyColumn, primaryKeyType, nodeProperties);

    // Create nodes
    for (const nodeData of nodesData) {
      const properties: Record<string, { value: any }> = {};
      for (const key of nodeKeys) {
        properties[key] = { value: nodeData[key] };
      }
      this.createNode(nodeTableName, properties);
    }

    // Parse edges JSON
    const edgesData = JSON.parse(edgesText);
    if (!Array.isArray(edgesData) || edgesData.length === 0) {
      throw new Error("Edges JSON must contain at least one object");
    }

    const firstEdge = edgesData[0];
    if (!("from" in firstEdge) || !("to" in firstEdge)) {
      throw new Error("Edge objects must contain 'from' and 'to' properties");
    }

    const edgeAttributeKeys = Object.keys(firstEdge).filter(
      (key) => key !== "from" && key !== "to"
    );

    // Infer edge types
    const edgeProperties = edgeAttributeKeys.map((key) => ({
      name: key,
      type: this.inferType(firstEdge[key]),
    }));

    this.createEdgeSchema(
      edgeTableName,
      [[nodeTableName, nodeTableName]],
      edgeProperties
    );

    // Create edges
    const nodeMap = new Map<string, GraphNode>();
    for (const node of this.nodes) {
      const key = `${node.tableName}::${node._primaryKeyValue}`;
      nodeMap.set(key, node);
    }

    for (const edgeData of edgesData) {
      const sourceKey = String(edgeData.from);
      const targetKey = String(edgeData.to);

      const sourceNode = nodeMap.get(`${nodeTableName}::${sourceKey}`);
      const targetNode = nodeMap.get(`${nodeTableName}::${targetKey}`);

      if (!sourceNode || !targetNode) {
        console.warn(`Skipping edge: source or target node not found`);
        continue;
      }

      const attributes: Record<string, InputChangeResult<any>> = {};
      for (const key of edgeAttributeKeys) {
        attributes[key] = { value: edgeData[key] };
      }

      try {
        this.createEdge(sourceNode, targetNode, this.edgeTables.find((t) => t.tableName === edgeTableName)!, attributes);
      } catch (err) {
        console.warn(`Skipping duplicate edge: ${sourceKey} -> ${targetKey}`);
      }
    }

    return this.snapshotGraphState();
  }

  /**
   * Create empty graph
   */
  createEmptyGraph(): GraphSnapshotState {
    this.nodes = [];
    this.edges = [];
    this.nodeTables = [];
    this.edgeTables = [];
    return this.snapshotGraphState();
  }

  /**
   * Get snapshot of current graph state
   */
  snapshotGraphState(): GraphSnapshotState {
    return {
      nodes: [...this.nodes],
      edges: [...this.edges],
      nodeTables: [...this.nodeTables],
      edgeTables: [...this.edgeTables],
      directed: this.directed,
    };
  }

  /**
   * Infer type from a value
   */
  private inferType(value: any): NonPrimaryKeyType | PrimaryKeyType {
    if (value === null || value === undefined) {
      return "STRING";
    }

    if (typeof value === "boolean") {
      return "BOOL";
    }

    if (typeof value === "number") {
      if (Number.isInteger(value)) {
        if (value >= -2147483648 && value <= 2147483647) {
          return "INT32";
        }
        return "INT64";
      }
      return "DOUBLE";
    }

    if (typeof value === "string") {
      // Try to parse as number
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== "") {
        if (Number.isInteger(num)) {
          if (num >= -2147483648 && num <= 2147483647) {
            return "INT32";
          }
          return "INT64";
        }
        return "DOUBLE";
      }
      return "STRING";
    }

    return "STRING";
  }

  /**
   * Parse a string value to the appropriate type
   */
  private parseValue(value: string, type: string): any {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    switch (type.toUpperCase()) {
      case "BOOL":
      case "BOOLEAN":
        return value.toLowerCase() === "true" || value === "1";
      case "INT32":
      case "INT64":
        return parseInt(value, 10);
      case "DOUBLE":
      case "FLOAT":
        return parseFloat(value);
      case "STRING":
      default:
        return value;
    }
  }
}

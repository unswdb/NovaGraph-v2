import { action, makeObservable, observable, runInAction } from "mobx";

import {
  isEdgeSchema,
  isNodeSchema,
  type EdgeSchema,
  type GraphDatabase,
  type GraphEdge,
  type GraphNode,
  type NodeSchema,
  type VisualizationResponse,
} from "./types";
import {
  GRAVITY,
  NODE_SIZE_SCALE,
  type Gravity,
  type NodeSizeScale,
} from "./renderer/constant";
import type { BaseGraphAlgorithm } from "./algorithms/implementations";

import { controller } from "~/MainController";

export type InitializedVisualizerStore = VisualizerStore & {
  database: NonNullable<VisualizerStore["database"]>;
};

export default class VisualizerStore {
  // CONSTRUCTORS
  constructor() {
    makeObservable(this, {
      database: observable,
      databases: observable,
      gravity: observable,
      nodeSizeScale: observable,
      code: observable,
      activeAlgorithm: observable,
      activeResponse: observable,
      initialize: action,
      cleanup: action,
      setDatabase: action,
      setGraphState: action,
      addDatabase: action,
      setGravity: action,
      setNodeSizeScale: action,
      setCode: action,
      setActiveAlgorithm: action,
      setActiveResponse: action,
    });
  }

  // OBSERVABLES
  controller = controller;
  database: GraphDatabase | null = null; // Currently active database
  databases: GraphDatabase[] = []; // List of database users owned
  gravity: Gravity = GRAVITY.ZERO_GRAVITY;
  nodeSizeScale: NodeSizeScale = NODE_SIZE_SCALE.MEDIUM;
  code: string = "";
  activeAlgorithm: BaseGraphAlgorithm | null = null;
  activeResponse: VisualizationResponse | null = null; // Can be algorithm or query result

  // ACTIONS
  initialize = async () => {
    // Initialize Kuzu controller
    await this.controller.initKuzu();

    // Define initial graph structure
    const graph = await this.controller.db.snapshotGraphState();

    runInAction(() => {
      // TODO: Change to controller helper function that retrieves
      // all the database list
      const { nodes, nodesMap } = this.buildNodesWithMap(graph.nodes);
      const { edges, edgesMap } = this.buildEdgesWithMap(graph.edges);
      const { nodeTables, nodeTablesMap } = this.buildNodeTablesWithMap(
        graph.nodeTables
      );
      const { edgeTables, edgeTablesMap } = this.buildEdgeTablesWithMap(
        graph.edgeTables
      );
      this.databases = [
        {
          label: "Default",
          graph: {
            nodes,
            nodesMap,
            edges,
            edgesMap,
            nodeTables,
            nodeTablesMap,
            edgeTables,
            edgeTablesMap,
            directed: true, // TODO: Distinguish between directed/non-directed in Kuzu
          },
        },
      ];
      this.database = this.databases[0];
    });
  };

  cleanup = () => {
    // this.controller.cleanup();
  };

  setDatabase = (database: GraphDatabase) => {
    this.database = database;
  };

  setGraphState = ({
    nodes: newNodes,
    edges: newEdges,
    nodeTables: newNodeTables,
    edgeTables: newEdgeTables,
  }: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    nodeTables: NodeSchema[];
    edgeTables: EdgeSchema[];
  }) => {
    this.checkInitialization();

    const { nodes, nodesMap } = this.buildNodesWithMap(newNodes);
    const { edges, edgesMap } = this.buildEdgesWithMap(newEdges);
    const { nodeTables, nodeTablesMap } =
      this.buildNodeTablesWithMap(newNodeTables);
    const { edgeTables, edgeTablesMap } =
      this.buildEdgeTablesWithMap(newEdgeTables);

    this.database = {
      ...this.database,
      graph: {
        ...this.database.graph,
        nodes,
        edges,
        nodesMap,
        edgesMap,
        nodeTables,
        nodeTablesMap,
        edgeTables,
        edgeTablesMap,
      },
    };
  };

  addDatabase = (database: GraphDatabase) => {
    this.databases = [...this.databases, database];
  };

  setGravity = (gravity: Gravity) => {
    this.gravity = gravity;
  };

  setNodeSizeScale = (nodeSizeScale: NodeSizeScale) => {
    this.nodeSizeScale = nodeSizeScale;
  };

  setCode = (code: string) => {
    this.code = code;
  };

  setActiveAlgorithm = (activeAlgorithm: BaseGraphAlgorithm) => {
    this.activeAlgorithm = activeAlgorithm;
  };

  setActiveResponse = (activeResponse: VisualizationResponse) => {
    this.activeResponse = activeResponse;
  };

  // UTILITIES FUNCTION
  protected checkInitialization(): asserts this is InitializedVisualizerStore {
    if (!this.database) {
      throw new Error("Database is not initialized");
    }
  }

  private buildNodeTablesWithMap(nodeTables: NodeSchema[]) {
    const builtNodeTables: NodeSchema[] = [];
    const nodeTablesMap: Map<string, NodeSchema> = new Map();

    nodeTables.forEach((t) => {
      const newTable = {
        tableName: String(t.tableName),
        tableType: t.tableType,
        primaryKey: String(t.primaryKey),
        primaryKeyType: t.primaryKeyType,
        properties: t.properties,
      };

      if (isNodeSchema(newTable)) {
        builtNodeTables.push(newTable);
        nodeTablesMap.set(t.tableName, newTable);
      }
    });

    return { nodeTables: builtNodeTables, nodeTablesMap };
  }

  private buildEdgeTablesWithMap(edgeTables: EdgeSchema[]) {
    const builtEdgeTables: EdgeSchema[] = [];
    const edgeTablesMap: Map<string, EdgeSchema> = new Map();

    edgeTables.forEach((t) => {
      const newTable = {
        tableName: String(t.tableName),
        tableType: t.tableType,
        primaryKey: String(t.primaryKey),
        primaryKeyType: t.primaryKeyType,
        properties: t.properties,
        sourceTableName: String(t.sourceTableName),
        targetTableName: String(t.targetTableName),
      };

      if (isEdgeSchema(newTable)) {
        builtEdgeTables.push(newTable);
        edgeTablesMap.set(t.tableName, newTable);
      }
    });

    return { edgeTables: builtEdgeTables, edgeTablesMap };
  }

  private buildNodesWithMap(nodes: GraphNode[]): {
    nodes: GraphNode[];
    nodesMap: Map<string, GraphNode>;
  } {
    const builtNodes: GraphNode[] = [];
    const nodesMap: Map<string, GraphNode> = new Map();

    nodes.forEach((n) => {
      const builtNode = {
        id: String(n.id),
        _primaryKey: String(n._primaryKey),
        _primaryKeyValue: String(n._primaryKeyValue),
        tableName: String(n.tableName),
        ...(n.attributes ? { attributes: n.attributes } : {}),
      };
      builtNodes.push(builtNode);
      nodesMap.set(n.id, builtNode);
    });

    return { nodes: builtNodes, nodesMap };
  }

  private buildEdgesWithMap(edges: GraphEdge[]): {
    edges: GraphEdge[];
    edgesMap: Map<[string, string], GraphEdge>;
  } {
    const builtEdges: GraphEdge[] = [];
    const edgesMap: Map<[string, string], GraphEdge> = new Map();

    edges.forEach((e) => {
      const source = String(e.source);
      const target = String(e.target);
      const builtEdge = {
        source,
        target,
        tableName: String(e.tableName),
        ...(e.attributes ? { attributes: e.attributes } : {}),
      };
      builtEdges.push(builtEdge);
      edgesMap.set([source, target], builtEdge);
    });

    return { edges: builtEdges, edgesMap };
  }
}

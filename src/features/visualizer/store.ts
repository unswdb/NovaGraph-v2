import { action, makeObservable, observable, runInAction } from "mobx";

import {
  isEdgeSchema,
  isNodeSchema,
  type EdgeSchema,
  type GraphDatabase,
  type GraphEdge,
  type GraphNode,
  type GraphSnapshotState,
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
      databaseDrawerStateMap: observable,
      initialize: action,
      cleanup: action,
      setDatabase: action,
      setGraphState: action,
      addAndSetDatabase: action,
      addDatabase: action,
      switchDatabase: action,
      deleteDatabase: action,
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
  databases: string[] = []; // List of database options available
  gravity: Gravity = GRAVITY.ZERO_GRAVITY;
  nodeSizeScale: NodeSizeScale = NODE_SIZE_SCALE.MEDIUM;
  databaseDrawerStateMap: Record<
    string,
    {
      code: string;
      activeAlgorithm: BaseGraphAlgorithm | null;
      activeResponse: VisualizationResponse | null;
    }
  > = {};

  // ACTIONS
  initialize = async () => {
    // Initialize Kuzu controller
    await this.controller.initSystem();

    const [rawGraph, rawDatabases, rawCurrentDatabaseName] = await Promise.all([
      this.controller.db.snapshotGraphState(),
      this.controller.db.listDatabases().catch(() => [] as string[]), // defaults to empty databases if error
      this.controller.db.getCurrentDatabaseName().catch(() => null), // defaults to null if error
    ]);

    // Define graph snapshot state
    const graphSnapshotState: GraphSnapshotState = {
      nodes: rawGraph?.nodes ?? [],
      edges: rawGraph?.edges ?? [],
      nodeTables: rawGraph?.nodeTables ?? [],
      edgeTables: rawGraph?.edgeTables ?? [],
      directed: rawGraph?.directed ?? true,
    };

    const currentDatabaseName =
      rawCurrentDatabaseName ?? rawDatabases[0] ?? null;

    const databases = this.buildDatabases([
      ...rawDatabases,
      currentDatabaseName,
    ]);
    databases.forEach((dbName) => {
      this.databaseDrawerStateMap[dbName] = {
        code: "",
        activeAlgorithm: null,
        activeResponse: null,
      };
    });

    const graph = this.buildGraphFromSnapshotState(graphSnapshotState);

    runInAction(() => {
      this.databases = databases;
      if (currentDatabaseName) {
        this.database = {
          name: currentDatabaseName,
          graph,
        };
      } else {
        this.database = null;
      }
    });
  };

  cleanup = () => {
    // this.controller.cleanup();
  };

  setDatabase = (database: GraphDatabase) => {
    this.database = database;
  };

  setGraphState = (snapshot: GraphSnapshotState) => {
    this.checkInitialization();

    const graph = this.buildGraphFromSnapshotState({
      ...snapshot,
      directed: snapshot.directed ?? true,
    });
    this.database = {
      ...this.database,
      graph,
    };
  };

  addAndSetDatabase = (name: string, snapshot: GraphSnapshotState) => {
    const graph = this.buildGraphFromSnapshotState(snapshot);
    this.database = {
      name,
      graph,
    };
    this.addDatabase(name);
  };

  addDatabase = (database: string) => {
    this.databases = this.buildDatabases([...this.databases, database]);
    this.databaseDrawerStateMap[database] = {
      code: "",
      activeAlgorithm: null,
      activeResponse: null,
    };
  };

  switchDatabase = async (name: string) => {
    await this.controller.db.connectToDatabase(name);

    // Define graph state of new database
    const rawGraph = await this.controller.db.snapshotGraphState();
    const graph = this.buildGraphFromSnapshotState({
      nodes: rawGraph?.nodes ?? [],
      edges: rawGraph?.edges ?? [],
      nodeTables: rawGraph?.nodeTables ?? [],
      edgeTables: rawGraph?.edgeTables ?? [],
      directed: rawGraph?.directed ?? true,
    });

    runInAction(() => {
      this.database = {
        name,
        graph,
      };
    });
  };

  deleteDatabase = async (name: string) => {
    this.checkInitialization();

    await this.controller.db.deleteDatabase(name);
    this.databases = this.databases.filter(
      (databaseName) => databaseName !== name
    );
    delete this.databaseDrawerStateMap[name];
  };

  setGravity = (gravity: Gravity) => {
    this.gravity = gravity;
  };

  setNodeSizeScale = (nodeSizeScale: NodeSizeScale) => {
    this.nodeSizeScale = nodeSizeScale;
  };

  setCode = (code: string) => {
    if (this.database == null) return;
    this.databaseDrawerStateMap[this.database.name].code = code;
  };

  setActiveAlgorithm = (activeAlgorithm: BaseGraphAlgorithm | null) => {
    if (this.database == null) return;
    this.databaseDrawerStateMap[this.database.name].activeAlgorithm =
      activeAlgorithm;
  };

  setActiveResponse = (activeResponse: VisualizationResponse | null) => {
    if (this.database == null) return;
    this.databaseDrawerStateMap[this.database.name].activeResponse =
      activeResponse;
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

  private buildDatabases(databases: string[]) {
    return [...new Set(databases)].sort((a, b) => a.localeCompare(b));
  }

  private buildGraphFromSnapshotState(snapshot: GraphSnapshotState) {
    const { nodes, nodesMap } = this.buildNodesWithMap(snapshot.nodes);
    const { edges, edgesMap } = this.buildEdgesWithMap(snapshot.edges);
    const { nodeTables, nodeTablesMap } = this.buildNodeTablesWithMap(
      snapshot.nodeTables
    );
    const { edgeTables, edgeTablesMap } = this.buildEdgeTablesWithMap(
      snapshot.edgeTables
    );

    return {
      nodes,
      nodesMap,
      edges,
      edgesMap,
      nodeTables,
      nodeTablesMap,
      edgeTables,
      edgeTablesMap,
      directed: snapshot.directed ?? true,
    };
  }
}

import { action, makeObservable, observable, runInAction } from "mobx";

import {
  isEdgeSchema,
  isNodeSchema,
  type DatabaseOption,
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

type GraphSnapshotInput = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeTables: NodeSchema[];
  edgeTables: EdgeSchema[];
  directed?: boolean;
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
      setActiveDatabaseFromSnapshot: action,
      addDatabase: action,
      refreshDatabases: action,
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
  databases: DatabaseOption[] = []; // List of database options available
  gravity: Gravity = GRAVITY.ZERO_GRAVITY;
  nodeSizeScale: NodeSizeScale = NODE_SIZE_SCALE.MEDIUM;
  code: string = "";
  activeAlgorithm: BaseGraphAlgorithm | null = null;
  activeResponse: VisualizationResponse | null = null; // Can be algorithm or query result

  // ACTIONS
  initialize = async () => {
    // Initialize Kuzu controller
    await this.controller.initSystem();

    const [rawGraph, listResult, currentDbName] = await Promise.all([
      this.controller.db.snapshotGraphState(),
      this.controller.db
        .listDatabases()
        .catch(() => ({ success: false, databases: [] as string[] })),
      this.controller.db.getCurrentDatabaseName().catch(() => null),
    ]);

    const graphSnapshot: GraphSnapshotInput = {
      nodes: rawGraph?.nodes ?? [],
      edges: rawGraph?.edges ?? [],
      nodeTables: rawGraph?.nodeTables ?? [],
      edgeTables: rawGraph?.edgeTables ?? [],
      directed: (rawGraph as GraphSnapshotInput)?.directed ?? false,
    };

    const availableNames =
      listResult && listResult.success && Array.isArray(listResult.databases)
        ? listResult.databases
        : [];

    const fallbackName = availableNames.length > 0 ? availableNames[0] : null;
    const activeName = currentDbName ?? fallbackName ?? null;

    const options = this.buildDatabaseOptions(availableNames, activeName);
    const graph = this.buildGraphFromSnapshot({
      ...graphSnapshot,
      directed: graphSnapshot.directed ?? false,
    });

    runInAction(() => {
      this.databases = options;
      if (activeName) {
        this.database = {
          name: activeName,
          label: this.formatDatabaseLabel(activeName),
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

  setGraphState = (snapshot: GraphSnapshotInput) => {
    this.checkInitialization();

    const directed =
      snapshot.directed ?? this.database.graph.directed ?? false;

    const graph = this.buildGraphFromSnapshot({
      ...snapshot,
      directed,
    });

    this.database = {
      ...this.database,
      graph,
    };
  };

  setActiveDatabaseFromSnapshot = (
    name: string,
    snapshot: GraphSnapshotInput
  ) => {
    const graph = this.buildGraphFromSnapshot(snapshot);
    const option = this.makeDatabaseOption(name);

    this.database = {
      name,
      label: option.label,
      graph,
    };

    this.databases = this.sortDatabaseOptions([
      ...this.databases.filter((db) => db.name !== name),
      option,
    ]);
  };

  addDatabase = (database: DatabaseOption) => {
    const exists = this.databases.some((db) => db.name === database.name);
    if (exists) {
      return;
    }
    this.databases = this.sortDatabaseOptions([...this.databases, database]);
  };

  refreshDatabases = async () => {
    const listResult = await this.controller.db
      .listDatabases()
      .catch(() => ({ success: false, databases: [] as string[] }));

    const options = this.buildDatabaseOptions(
      listResult.success ? listResult.databases : [],
      this.database?.name
    );

    runInAction(() => {
      this.databases = options;
    });

    return options;
  };

  switchDatabase = async (name: string) => {
    const result = await this.controller.db.connectToDatabase(name);

    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          result.message ||
          "Failed to connect to the selected database",
      };
    }

    const rawGraph = await this.controller.db.snapshotGraphState();
    const graph = this.buildGraphFromSnapshot({
      nodes: rawGraph?.nodes ?? [],
      edges: rawGraph?.edges ?? [],
      nodeTables: rawGraph?.nodeTables ?? [],
      edgeTables: rawGraph?.edgeTables ?? [],
      directed: (rawGraph as GraphSnapshotInput)?.directed ?? false,
    });

    runInAction(() => {
      this.database = {
        name,
        label: this.formatDatabaseLabel(name),
        graph,
      };
    });

    await this.refreshDatabases();

    return {
      success: true,
      message: result.message,
    };
  };

  deleteDatabase = async (name: string) => {
    if (this.database?.name === name) {
      return {
        success: false,
        error: "Cannot delete the active database",
      };
    }

    const result = await this.controller.db.deleteDatabase(name);

    if (result.success) {
      await this.refreshDatabases();
    }

    return result;
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

  private buildGraphFromSnapshot(snapshot: GraphSnapshotInput) {
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
      directed: snapshot.directed ?? false,
    };
  }

  private buildDatabaseOptions(
    names: string[],
    activeName?: string | null
  ): DatabaseOption[] {
    const uniqueNames = new Set<string>();

    names
      .filter(
        (name): name is string => typeof name === "string" && name.length > 0
      )
      .forEach((name) => uniqueNames.add(name));

    if (activeName && activeName.length > 0) {
      uniqueNames.add(activeName);
    }

    const options = Array.from(uniqueNames).map((name) =>
      this.makeDatabaseOption(name)
    );

    return this.sortDatabaseOptions(options);
  }

  private makeDatabaseOption(name: string): DatabaseOption {
    return {
      name,
      label: this.formatDatabaseLabel(name),
    };
  }

  private formatDatabaseLabel(name: string) {
    if (!name) return "Default";

    const normalized = name.trim();
    if (
      normalized.toLowerCase() === "default" ||
      normalized.toLowerCase() === "default_async_db"
    ) {
      return "Default";
    }

    return normalized
      .replace(/[_-]+/g, " ")
      .split(" ")
      .map((part) =>
        part.length > 0
          ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          : part
      )
      .join(" ");
  }

  private sortDatabaseOptions(options: DatabaseOption[]) {
    return [...options].sort((a, b) => a.label.localeCompare(b.label));
  }
}

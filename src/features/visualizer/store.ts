import { action, makeObservable, observable, runInAction } from "mobx";
import type { GraphDatabase, GraphEdge, GraphModule, GraphNode } from "./types";
import {
  GRAVITY,
  NODE_SIZE_SCALE,
  type Gravity,
  type NodeSizeScale,
} from "./constant";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "./algorithms/implementations";
import { controller } from "~/MainController";

export type InitializedVisualizerStore = VisualizerStore & {
  wasmModule: NonNullable<VisualizerStore["wasmModule"]>;
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
      activeAlgorithm: observable,
      activeResponse: observable,
      initialize: action,
      cleanup: action,
      setDatabase: action,
      setNodes: action,
      setEdges: action,
      addDatabase: action,
      setGravity: action,
      setNodeSizeScale: action,
      setActiveAlgorithm: action,
      setActiveResponse: action,
    });
  }

  // OBSERVABLES
  controller = controller;
  wasmModule: GraphModule | null = null;
  database: GraphDatabase | null = null;
  databases: GraphDatabase[] = [];
  gravity: Gravity = GRAVITY.ZERO_GRAVITY;
  nodeSizeScale: NodeSizeScale = NODE_SIZE_SCALE.MEDIUM;
  activeAlgorithm: BaseGraphAlgorithm | null = null;
  activeResponse: BaseGraphAlgorithmResult | null = null;

  // ACTIONS
  initialize = async () => {
    // Initialize Kuzu controller
    await this.controller.initKuzu();

    // Initialize WASM module
    this.wasmModule = await this.controller.getGraphModule();

    // Define initial graph structure
    const graph = await this.controller.initGraph();

    // console.warn('Testing createSchema2...');
   
    // // ----------------------------
    // // 1. Create Person table (many primitives)
    // // ----------------------------
    // const personResult = await controller.db.createSchema(
    //   'node',
    //   'Person',
    //   'name', // primaryKey
    //   {
    //     name: 'STRING',
    //     age: 'INT',
    //     alive: 'BOOLEAN',
    //     height: 'DOUBLE',
    //     uuid: 'UUID',
    //   }
    // );
    // console.warn('Person schema result:', personResult);
    
    // const addressResult = await controller.db.createSchema(
    //   "node",
    //   "Address",
    //   "id", // primaryKey
    //   {
    //     id: "STRING",
    //     location: {
    //       kind: "STRUCT",
    //       fields: {
    //         street: "STRING",
    //         city: "STRING",
    //         zipcode: "INT",
    //       },
    //     },
    //   }
    // );
    // console.warn("Address schema result:", addressResult);

    // const personQuery = await controller.db.createNode('Person', {
    //   name:  ['STRING',  'Tom Hanks'],
    //   age:   ['INT',     67],
    //   alive: ['BOOLEAN', true],
    //   height:['DOUBLE',  1.83],
    //   uuid:  ['UUID',    '123e4567-e89b-12d3-a456-426614174000']
    // });
    // console.warn('Person create query:', personQuery);

    // const addressQuery = await controller.db.createNode('Address', {
    //   id: ['STRING', 'ADDR-001'],   // primary key
    //   location: [
    //     { kind: 'STRUCT', fields: {
    //       street: 'STRING',
    //       city:   'STRING',
    //       zipcode:'INT'
    //     }},
    //     {
    //       street:  '123 Main St',
    //       city:    'Los Angeles',
    //       zipcode: 90001
    //     }
    //   ]
    // });
   
    // console.warn('Address create query:', addressQuery);
   


    // const addressQuery2 = await controller.db.createNode('Address', {
    //   id: ['STRING', 'ADDR-0012'],   // primary key
    //   // id2: ['STRING', 'ADDR-00123'],   // primary key


    //   // location: [
    //   //   { kind: 'STRUCT', fields: {
    //   //     street: 'STRING',
    //   //     city:   'STRING',
    //   //     zipcode:'INT'
    //   //   }},
    //   //   {
    //   //     street:  '123 Main St',
    //   //     city:    'Los Angeles',
    //   //     zipcode: 90001
    //   //   }
    //   // ]
    // });
   
    // console.warn('Address create query:', addressQuery2);

    runInAction(() => {
      // TODO: Change to controller helper function that retrieves all the database list
      this.databases = [
        {
          label: "Default",
          graph: {
            nodes: graph.nodes.map((n: GraphNode) => ({
              id: String(n.id),
              tableName: String(n.tableName),
              ...n.label && { label: n.label },
              ...n.attributes && { attributes : n.attributes },
            })),
            edges: graph.edges.map((e: GraphEdge) => ({
              source: String(e.source),
              target: String(e.target),
              ...e.weight && { weight: Number(e) },
              ...e.attributes && { attributes: e.attributes },
            })),
            directed: graph.directed,
          },
        },
      ];
      this.database = this.databases[0];
    });
  };

  cleanup = () => {
    // TODO: this.controller.cleanup();
  };

  setDatabase = (database: GraphDatabase) => {
    this.database = database;
  };

  setNodes = (nodes: GraphNode[]) => {
    this.checkInitialization();
    this.database.graph.nodes = nodes;
  };

  setEdges = (edges: GraphEdge[]) => {
    this.checkInitialization();
    this.database.graph.edges = edges;
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

  setActiveAlgorithm = (activeAlgorithm: BaseGraphAlgorithm) => {
    this.activeAlgorithm = activeAlgorithm;
  };

  setActiveResponse = (activeResponse: BaseGraphAlgorithmResult) => {
    this.activeResponse = activeResponse;
  };

  // UTILITIES FUNCTION
  protected checkInitialization(): asserts this is InitializedVisualizerStore {
    if (!this.wasmModule && !this.database) {
      throw new Error("WASM module is not initialized");
    }
  }
}

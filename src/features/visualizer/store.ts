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
   
    // console.warn('Address create query:', addressQuery2);

    // this.setNodes(addressQuery2.nodes)
    // this.setEdges(addressQuery2.edges)

// // ----------------------------
// // 2. Delete a Person by primary key
// // ----------------------------
// const deletePersonResult = await controller.db.deleteNode(
//   'Person',
//   'name',
//   'Tom Hanks'
// );
// console.warn('Delete Person result:', deletePersonResult);

// // ----------------------------
// // 3. Delete an Address by primary key
// // ----------------------------
// const deleteAddressResult = await controller.db.deleteNode(
//   'Address',
//   'id',
//   'ADDR-001'
// );
// console.warn('Delete Address result:', deleteAddressResult);



// // FLOAT
// const floatSchema = await controller.db.createSchema('node', 'FloatOnly', 'id', { id: 'FLOAT' });
// const floatInsert = await controller.db.createNode('FloatOnly', { id: ['FLOAT', 3.14] });
// const floatDelete = await controller.db.deleteNode('FloatOnly', 'id', 3.14);
// console.warn("floatSchema")
// console.log(floatSchema)
// console.log(floatInsert)

// console.log(floatDelete)


// // DOUBLE
// const doubleSchema = await controller.db.createSchema('node', 'DoubleOnly', 'id', { id: 'DOUBLE' });
// const doubleInsert = await controller.db.createNode('DoubleOnly', { id: ['DOUBLE', 2.718281828] });
// const doubleDelete = await controller.db.deleteNode('DoubleOnly', 'id', 2.718281828);
// console.warn("double")
// console.log(doubleSchema)
// console.log(doubleInsert)
// console.log(doubleDelete)

// // DECIMAL
// // const decimalSchema = await controller.db.createSchema('node', 'DecimalOnly', 'id', { id: 'DECIMAL' });
// // const decimalInsert = await controller.db.createNode('DecimalOnly', { id: ['DECIMAL', '123.4500'] });
// // const decimalDelete = await controller.db.deleteNode('DecimalOnly', 'id', '123.4500');

// // UUID
// const uuidSchema = await controller.db.createSchema('node', 'UuidOnly', 'id', { id: 'UUID' });
// const uuidValue = '123e4567-e89b-12d3-a456-426614174000';
// const uuidInsert = await controller.db.createNode('UuidOnly', { id: ['UUID', uuidValue] });
// const uuidDelete = await controller.db.deleteNode('UuidOnly', 'id', uuidValue);
// console.warn("uuid")
// console.log(uuidSchema)
// console.log(uuidInsert)
// console.log(uuidDelete)

// // STRING
// const stringSchema = await controller.db.createSchema('node', 'StringOnly', 'id', { id: 'STRING' });
// const stringInsert = await controller.db.createNode('StringOnly', { id: ['STRING', 'hello-world'] });
// const stringDelete = await controller.db.deleteNode('StringOnly', 'id', 'hello-world');
// console.log(stringDelete)


// // DATE
// const dateSchema = await controller.db.createSchema('node', 'DateOnly', 'id', { id: 'DATE' });
// const dateValue = '2025-09-27';
// const dateInsert = await controller.db.createNode('DateOnly', { id: ['DATE', dateValue] });
// const dateDelete = await controller.db.deleteNode('DateOnly', 'id', dateValue);
// console.warn("dateSchema")
// console.log(dateSchema)
// console.log(dateInsert)
// console.log(dateDelete)


// // TIMESTAMP
// const tsSchema = await controller.db.createSchema('node', 'TimestampOnly', 'id', { id: 'TIMESTAMP' });
// const tsValue = '2025-09-27T12:34:56Z';
// const tsInsert = await controller.db.createNode('TimestampOnly', { id: ['TIMESTAMP', tsValue] });
// const tsDelete = await controller.db.deleteNode('TimestampOnly', 'id', tsValue);
// console.log(tsSchema)
// console.log(tsInsert)
// console.log(tsDelete)

// // BLOB
// // const blobSchema = await controller.db.createSchema('node', 'BlobOnly', 'id', { id: 'BLOB' });
// // const blobValue = new Uint8Array([1, 2, 3, 4, 5]);
// // const blobInsert = await controller.db.createNode('BlobOnly', { id: ['BLOB', blobValue] });
// // const blobDelete = await controller.db.deleteNode('BlobOnly', 'id', blobValue);

// // SERIAL
// const serialSchema = await controller.db.createSchema('node', 'SerialOnly', 'id', { id: 'SERIAL' });
// // If your DB auto-generates SERIAL, you can omit it in createNode; here we set an explicit value for testing.
// const serialValue = 101;
// const serialInsert = await controller.db.createNode('SerialOnly', { id: ['SERIAL', serialValue] });
// const serialDelete = await controller.db.deleteNode('SerialOnly', 'id', serialValue);
// console.log(serialSchema)
// console.log(serialInsert)
// console.log(serialDelete)



    runInAction(() => {
      // TODO: Change to controller helper function that retrieves all the database list
      this.databases = [
        {
          label: "Default",
          graph: {
            nodes: graph.nodes.map((n: GraphNode) => ({
              id: String(n.id),
              label: n.label,
              attributes: n.attributes,
            })),
            edges: graph.edges.map((e: GraphEdge) => ({
              source: String(e.source),
              target: String(e.target),
            })),
            directed: graph.directed,
          },
        },
      ];
      this.database = this.databases[0];
    });
  };

  cleanup = () => {
    // controller.cleanup();
  };

  setDatabase = (database: GraphDatabase) => {
    this.database = database;
  };

  setNodes = (nodes: GraphNode[]) => {
    this.checkInitialization();
    this.database.graph.nodes = nodes;
    // TODO: save the new database state to kuzu
  };

  setEdges = (edges: GraphEdge[]) => {
    this.checkInitialization();
    this.database.graph.edges = edges;
    // TODO: save the new database state to kuzu
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

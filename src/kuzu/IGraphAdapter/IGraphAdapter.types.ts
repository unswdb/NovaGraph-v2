export type IGraphInput = {
    nodes: number;                  // nodes
    src: Int32Array;                  // length = E
    dst: Int32Array;                  // length = E
    directed: boolean;                 // true = directed
    weight?: Float64Array | Float32Array; // optional, length = E
  };
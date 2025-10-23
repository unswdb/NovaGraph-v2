// TODO: lint
export type IgraphInput = {
  nodes: number; // nodes number
  src: Int32Array; // length = E
  dst: Int32Array; // length = E
  directed: boolean; // true = directed
  weight?: Float64Array | Float32Array; // optional, length = E
};

export type KuzuToIgraphParseResult = {
  IgraphInput: IgraphInput;
  KuzuToIgraphMap: Map<string, number>; // Map Kuzu ID to Igraph ID
  IgraphToKuzuMap: Map<number, string>; // Map back Igraph ID to Kuzu ID
};

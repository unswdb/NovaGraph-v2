import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type BFSOutputData = {
  source: string;
  nodesFound: number;
  layers: { layer: string[]; index: number }[];
};
type BFSOutput = GraphAlgorithmResult<BFSOutputData>;

export const bfs = createGraphAlgorithm<BFSOutput>({
  title: "Breadth-First Search",
  description: "Traverse the graph using BFS starting from a node",
  inputs: [{ label: "Start Node", type: "select", source: "nodes" }],
  wasmFunction: "bfs",
  output: (result: BFSOutput) => <BFS {...result} />,
});

function BFS(props: BFSOutput) {
  const { source, nodesFound, layers } = props.data;
  return <p>yerr</p>;
}

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type BFSOutputData = {
  source: string;
  nodesFound: number;
  layers: { layer: string[]; index: number }[];
};

export const bfs = createGraphAlgorithm<BFSOutputData>({
  title: "Breadth-First Search",
  description: "Traverse the graph using BFS starting from a node",
  inputs: [
    {
      id: "bfs-start-node",
      label: "Start Node",
      type: "algorithm-select",
      source: "nodes",
    },
  ],
  wasmFunction: (module, [args]) => {
    if (module) return module.bfs(args);
  },
  output: (props) => <BFS {...props} />,
});

function BFS(props: GraphAlgorithmResult<BFSOutputData>) {
  const { source, nodesFound, layers } = props.data;
  return <p>BFS output</p>;
}

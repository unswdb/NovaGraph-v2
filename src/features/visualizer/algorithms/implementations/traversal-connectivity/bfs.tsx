import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type BFSOutputData = {
  source: string;
  nodesFound: number;
  layers: { layer: string[]; index: number }[];
};

export const bfs = createGraphAlgorithm<BFSOutputData>({
  title: "Breadth-First Search",
  description:
    "Traverses the graph from a source by exploring all neighbors before moving on to the next level. It continues until all nodes are visited.",
  inputs: [
    createAlgorithmSelectInput({
      id: "bfs-start-node",
      label: "Start Node",
      source: "nodes",
    }),
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

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type DFSOutputData = {
  source: string;
  nodesFound: number;
  subtrees: { num: number; tree: string[] }[];
};

export const dfs = createGraphAlgorithm<DFSOutputData>({
  title: "Depth-First Search",
  description:
    "Traverses the graph from a source by exploring as far as possible along one branch before backtracking. It continues until all nodes are visited.",
  inputs: [
    createAlgorithmSelectInput({
      id: "dfs-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: (module, [args]) => {
    if (module) return module.dfs(args);
  },
  output: (props) => <DFS {...props} />,
});

function DFS(props: GraphAlgorithmResult<DFSOutputData>) {
  const { source, nodesFound, subtrees } = props.data;
  return <p>DFS output: {JSON.stringify(props.data, null, 2)}</p>;
}

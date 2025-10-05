import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type CheckAdjacencyOutputData = {
  source: string;
  target: string;
  adjacent: boolean;
  weight?: number; // only if edge exists AND weights present
};

export const checkAdjacency = createGraphAlgorithm<CheckAdjacencyOutputData>({
  title: "Check Adjacency",
  description: "Checks to see if two nodes are connected by a single edge.",
  inputs: [
    createAlgorithmSelectInput({
      id: "check-adjacency-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
    createAlgorithmSelectInput({
      id: "check-adjacency-end-node",
      key: "end_node",
      displayName: "End Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1, arg2]) => {
    if (module) return module.vertices_are_adjacent(arg1, arg2);
  },
  output: (props) => <CheckAdjacency {...props} />,
});

function CheckAdjacency(props: GraphAlgorithmResult<CheckAdjacencyOutputData>) {
  const { source, target, adjacent, weight } = props.data;
  return <p>Check Adjacency output: {JSON.stringify(props.data, null, 2)}</p>;
}

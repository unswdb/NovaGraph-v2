import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type BellmanFordAToBOutputData = {
  source: string;
  target: string;
  weighted: boolean;
  path: {
    from: string;
    to: string;
    weight?: number;
  }[];
  totalWeight?: number;
};

export const bellmanFordAToB = createGraphAlgorithm<BellmanFordAToBOutputData>({
  title: "Bellman-Ford (A to B)",
  description:
    "Finds the shortest path from one node to another, even with negative weights",
  inputs: [
    createAlgorithmSelectInput({
      id: "bellman-ford-a-to-b-start-node",
      label: "Start Node",
      source: "nodes",
      required: true,
    }),
    createAlgorithmSelectInput({
      id: "bellman-ford-a-to-b-end-node",
      label: "End Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1, arg2]) => {
    if (module) return module.bellman_ford_source_to_target(arg1, arg2);
  },
  output: (props) => <BellmanFordAToB {...props} />,
});

function BellmanFordAToB(
  props: GraphAlgorithmResult<BellmanFordAToBOutputData>
) {
  const { source, target, weighted, path, totalWeight } = props.data;
  return (
    <p>Bellman Ford (A to B) output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

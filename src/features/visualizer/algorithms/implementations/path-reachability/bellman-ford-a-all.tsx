import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type BellmanFordAToAllOutputData = {
  source: string;
  weighted: boolean;
  paths: {
    from: string;
    to: string;
    weight?: number;
  }[];
};

export const bellmanFordAToAll =
  createGraphAlgorithm<BellmanFordAToAllOutputData>({
    title: "Bellman-Ford (A to All)",
    description:
      "Finds the shortest path from one node to all other nodes, even with negative weights",
    inputs: [
      createAlgorithmSelectInput({
        id: "bellman-ford-a-to-all-start-node",
        label: "Start Node",
        source: "nodes",
        required: true,
      }),
    ],
    wasmFunction: (module, [args]) => {
      if (module) return module.bellman_ford_source_to_all(args);
    },
    output: (props) => <BellmanFordAToAll {...props} />,
  });

function BellmanFordAToAll(
  props: GraphAlgorithmResult<BellmanFordAToAllOutputData>
) {
  const { source, weighted, paths } = props.data;
  return (
    <p>Bellman Ford (A to All) output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

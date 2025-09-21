import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type DijkstraAToBOutputData = {
  source: string;
  target: string;
  weighted: boolean;
  path: { from: string; to: string; weight?: number }[];
  totalWeight?: number;
};

export const dijkstraAToB = createGraphAlgorithm<DijkstraAToBOutputData>({
  title: "Dijkstra (A to B)",
  description: "Finds the shortest path from one node to another",
  inputs: [
    createAlgorithmSelectInput({
      id: "dijkstra-a-to-b-start-node",
      label: "Start Node",
      source: "nodes",
      required: true,
    }),
    createAlgorithmSelectInput({
      id: "dijkstra-a-to-b-end-node",
      label: "End Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1, arg2]) => {
    if (module) return module.dijkstra_source_to_target(arg1, arg2);
  },
  output: (props) => <DijkstraAToB {...props} />,
});

function DijkstraAToB(props: GraphAlgorithmResult<DijkstraAToBOutputData>) {
  const { source, target, weighted, path, totalWeight } = props.data;
  return <p>Dijkstra (A to B) output: {JSON.stringify(props.data, null, 2)}</p>;
}

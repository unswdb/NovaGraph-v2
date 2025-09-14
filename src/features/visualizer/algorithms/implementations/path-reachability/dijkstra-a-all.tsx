import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type DijkstraAToAllOutputData = {
  source: string;
  weighted: boolean;
  paths: { from: string; to: string; weight?: number }[];
};

export const dijkstraAToAll = createGraphAlgorithm<DijkstraAToAllOutputData>({
  title: "Dijkstra (A to All)",
  description: "Finds the shortest path from one node to all other nodes",
  inputs: [
    createAlgorithmSelectInput({
      id: "dijkstra-a-to-all-start-node",
      label: "Start Node",
      source: "nodes",
    }),
  ],
  wasmFunction: (module, [args]) => {
    if (module) return module.dijkstra_source_to_all(args);
  },
  output: (props) => <DijkstraAToAll {...props} />,
});

function DijkstraAToAll(props: GraphAlgorithmResult<DijkstraAToAllOutputData>) {
  const { source, weighted, paths } = props.data;
  return <p>Dijkstra (A to All) output</p>;
}

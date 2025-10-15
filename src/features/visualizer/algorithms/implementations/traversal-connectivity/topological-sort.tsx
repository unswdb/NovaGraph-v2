import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type TopologicalSortOutputData = {
  order: {
    id: number; // numeric vertex id
    node: string; // vertex name
  }[]; // in topological order
};

export const topologicalSort = createGraphAlgorithm<TopologicalSortOutputData>({
  title: "Topological Sort",
  description:
    "Orders nodes in a directed acyclic graph (DAG) such that all edges go from earlier to later nodes",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.topological_sort();
  },
  output: (props) => <TopologicalSort {...props} />,
});

function TopologicalSort(
  props: GraphAlgorithmResult<TopologicalSortOutputData>
) {
  const { order } = props.data;
  return <p>Topological Sort output: {JSON.stringify(props.data, null, 2)}</p>;
}

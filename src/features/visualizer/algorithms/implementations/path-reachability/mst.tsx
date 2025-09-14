import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type MinimalSpanningTreeOutputData = {
  weighted: boolean;
  maxEdges: number; // ecount of original graph
  totalWeight?: number; // only if weighted (sum over MST edges)
  edges: {
    num: number; // 1-based order in returned MST list
    from: string;
    to: string;
    weight?: number;
  }[];
};

export const mst = createGraphAlgorithm<MinimalSpanningTreeOutputData>({
  title: "Minimal Spanning Tree",
  description:
    "Finds the subset of edges that connects all nodes in the graph with the minimum possible total edge weight.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.min_spanning_tree();
  },
  output: (props) => <MinimalSpanningTree {...props} />,
});

function MinimalSpanningTree(
  props: GraphAlgorithmResult<MinimalSpanningTreeOutputData>
) {
  const { weighted, maxEdges, totalWeight, edges } = props.data;
  return <p>Minimal Spanning Tree output</p>;
}

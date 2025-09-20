import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type GraphDiameterOutputData = {
  source: string;
  target: string;
  weighted: boolean;
  diameter: number;
  path: {
    from: string;
    to: string;
    weight?: number; // per-edge, only if weighted
  }[];
};

export const graphDiameter = createGraphAlgorithm<GraphDiameterOutputData>({
  title: "Graph Diameter",
  description: "Calculates the longest shortest path between any two nodes.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.diameter();
  },
  output: (props) => <GraphDiameter {...props} />,
});

function GraphDiameter(props: GraphAlgorithmResult<GraphDiameterOutputData>) {
  const { source, target, weighted, diameter, path } = props.data;
  return <p>Graph Diameter output: {JSON.stringify(props.data, null, 2)}</p>;
}

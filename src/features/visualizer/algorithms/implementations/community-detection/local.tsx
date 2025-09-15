import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type LocalClusteringCoefficientOutputData = {
  global_coefficient: number; // 4 dp, avg-ignore-zeros
  coefficients: {
    id: number; // vertex id
    node: string; // vertex name
    value: number; // 4 dp (can be NaN when undefined)
  }[];
};

export const localClusteringCoefficient =
  createGraphAlgorithm<LocalClusteringCoefficientOutputData>({
    title: "Local Clustering Coefficient",
    description:
      "Measures the number of triangles that pass through a node. Any nodes with a clustering coefficient of 0 are not part of any triangles.",
    inputs: [],
    wasmFunction: (module, _) => {
      if (module) return module.local_clustering_coefficient();
    },
    output: (props) => <LocalClusteringCoefficient {...props} />,
  });

function LocalClusteringCoefficient(
  props: GraphAlgorithmResult<LocalClusteringCoefficientOutputData>
) {
  const { global_coefficient, coefficients } = props.data;
  return (
    <p>
      Local Clustering Coefficient output: {JSON.stringify(props.data, null, 2)}
    </p>
  );
}

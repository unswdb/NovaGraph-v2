import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type TriangleCountOutputData = {
  triangles: {
    id: number; // 1-based triangle id
    node1: string;
    node2: string;
    node3: string;
  }[];
};

export const triangleCount = createGraphAlgorithm<TriangleCountOutputData>({
  title: "Triangle Count",
  description:
    "Counts the number of triangles (groups of 3 connected nodes) in a graph.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.triangle_count();
  },
  output: (props) => <TriangleCount {...props} />,
});

function TriangleCount(props: GraphAlgorithmResult<TriangleCountOutputData>) {
  const { triangles } = props.data;
  return <p>Triangle Count output: {JSON.stringify(props.data, null, 2)}</p>;
}

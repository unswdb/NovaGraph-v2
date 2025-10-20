import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type EulerianPathOutputData = {
  start: string; // name of first vertex in sequence
  end: string; // name of last vertex in sequence
  path: {
    from: string;
    to: string;
    weight?: number;
  }[]; // consecutive steps
};

export const eulerianPath = createGraphAlgorithm<EulerianPathOutputData>({
  title: "Eulerian Path",
  description: "Finds a path that visits every edge exactly once.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.eulerian_path();
  },
  output: (props) => <EulerianPath {...props} />,
});

function EulerianPath(props: GraphAlgorithmResult<EulerianPathOutputData>) {
  const { start, end, path } = props.data;
  return <p>Eulerian Path output: {JSON.stringify(props.data, null, 2)}</p>;
}

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type EulerianCircuitOutputData = {
  path: {
    from: string;
    to: string;
  }[]; // consecutive steps
};

export const eulerianCircuit = createGraphAlgorithm<EulerianCircuitOutputData>({
  title: "Eulerian Circuit",
  description:
    "Finds a path that visits every edge exactly once and returns to the starting node.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.eulerian_circuit();
  },
  output: (props) => <EulerianCircuit {...props} />,
});

function EulerianCircuit(
  props: GraphAlgorithmResult<EulerianCircuitOutputData>
) {
  const { path } = props.data;
  return <p>Eulerian Circuit output: {JSON.stringify(props.data, null, 2)}</p>;
}

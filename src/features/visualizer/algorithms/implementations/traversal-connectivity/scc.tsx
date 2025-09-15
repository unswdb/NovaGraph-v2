import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type SCCOutputData = {
  components: string[][]; // index = component id, value = node-name[]
};

export const scc = createGraphAlgorithm<SCCOutputData>({
  title: "Strongly Connected (SCC)",
  description: "Finds the strongly connected components in a graph.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.strongly_connected_components();
  },
  output: (props) => <SCC {...props} />,
});

function SCC(props: GraphAlgorithmResult<SCCOutputData>) {
  const { components } = props.data;
  return (
    <p>
      Strongly Connected (SCC) output: {JSON.stringify(props.data, null, 2)}
    </p>
  );
}

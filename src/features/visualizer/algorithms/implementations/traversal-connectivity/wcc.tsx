import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type WCCOutputData = {
  components: string[][]; // index = component id, value = node-name[]
};

export const wcc = createGraphAlgorithm<WCCOutputData>({
  title: "Weakly Connected (WCC)",
  description: "Finds the weakly connected components in a graph.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.weakly_connected_components();
  },
  output: (props) => <WCC {...props} />,
});

function WCC(props: GraphAlgorithmResult<WCCOutputData>) {
  const { components } = props.data;
  return (
    <p>Weakly Connected (WCC) output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

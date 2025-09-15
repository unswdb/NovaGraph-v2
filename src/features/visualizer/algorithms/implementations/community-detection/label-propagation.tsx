import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type LabelPropagationOutputData = {
  communities: string[][];
};

export const labelPropagation =
  createGraphAlgorithm<LabelPropagationOutputData>({
    title: "Label Propagation",
    description:
      "Assigns nodes to communities based on their labels. Results may vary between runs due to the randomness of the algorithm.",
    inputs: [],
    wasmFunction: (module, _) => {
      if (module) return module.label_propagation();
    },
    output: (props) => <LabelPropagation {...props} />,
  });

function LabelPropagation(
  props: GraphAlgorithmResult<LabelPropagationOutputData>
) {
  const { communities } = props.data;
  return <p>Label Propagation output: {JSON.stringify(props.data, null, 2)}</p>;
}

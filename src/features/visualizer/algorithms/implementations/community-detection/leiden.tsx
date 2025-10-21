import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createNumberInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type LeidenOutputData = {
  modularity: number;
  quality: number;
  communities: string[][];
};

export const leiden = createGraphAlgorithm<LeidenOutputData>({
  title: "Leiden Algorithm",
  description:
    "Improved Louvain algorithm that ensures more stable and well-connected communities.",
  inputs: [
    createNumberInput({
      id: "leiden-resolution",
      key: "resolution",
      displayName: "Resolution",
      defaultValue: 0.25,
      min: 0.1,
      max: 2,
      step: 0.01,
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1]) => {
    // if (module) return module.leiden(arg1);
  },
  output: (props) => <Leiden {...props} />,
});

function Leiden(props: GraphAlgorithmResult<LeidenOutputData>) {
  const { modularity, quality, communities } = props.data;
  return <p>Leiden output: {JSON.stringify(props.data, null, 2)}</p>;
}

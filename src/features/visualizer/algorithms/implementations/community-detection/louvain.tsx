import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createNumberInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type LouvainOutputData = {
  modularity: number;
  communities: string[][]; // index = community id, value = node-name[]
};

export const louvain = createGraphAlgorithm<LouvainOutputData>({
  title: "Louvain Algorithm",
  description:
    "Finds communities by maximizing modularity in a hierarchical way. Resolution determines the size of the communities, with higher values resulting in smaller communities.",
  inputs: [
    createNumberInput({
      id: "louvain-resolution",
      key: "resolution",
      displayName: "Resolution",
      defaultValue: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      required: true,
    }),
  ],
  wasmFunction: async (controller, [arg1]) => {
    // if (module) return module.louvain(arg1);
  },
  output: (props) => <Louvain {...props} />,
});

function Louvain(props: GraphAlgorithmResult<LouvainOutputData>) {
  const { modularity, communities } = props.data;
  return <p>Louvain output: {JSON.stringify(props.data, null, 2)}</p>;
}

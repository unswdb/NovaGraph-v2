import { createNumberInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type KCoreOutputData = {
  k: number;
  max_coreness: number; // max over all vertices
  cores: {
    id: number; // vertex id (original graph)
    node: string; // vertex name
  }[];
};

export const kCore = createGraphAlgorithm<KCoreOutputData>({
  title: "K-Core Decomposition",
  description:
    "Finds groups of nodes where each has at least k neighbors within the group.",
  inputs: [
    createNumberInput({
      id: "k-core-k",
      key: "k",
      displayName: "K",
      defaultValue: 1,
      min: 1,
      step: 1,
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1]) => {
    if (module) return module.k_core(arg1);
  },
  output: (props) => <KCore {...props} />,
});

function KCore(props: GraphAlgorithmResult<KCoreOutputData>) {
  const { k, max_coreness, cores } = props.data;
  return <p>Leiden output: {JSON.stringify(props.data, null, 2)}</p>;
}

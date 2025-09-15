import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type FastGreedyOutputData = {
  modularity: number;
  communities: string[][];
};

export const fastGreedy = createGraphAlgorithm<FastGreedyOutputData>({
  title: "Fast Greedy Algorithm",
  description: "Builds communities by greedily optimizing modularity.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.fast_greedy();
  },
  output: (props) => <FastGreedy {...props} />,
});

function FastGreedy(props: GraphAlgorithmResult<FastGreedyOutputData>) {
  const { modularity, communities } = props.data;
  return <p>Fast Greedy output: {JSON.stringify(props.data, null, 2)}</p>;
}

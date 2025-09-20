import {
  createAlgorithmSelectInput,
  createNumberInput,
} from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type RandomWalkOutputData = {
  source: string;
  steps: number; // requested steps
  weighted: boolean;
  maxFrequencyNode: string; // node name with highest visits
  maxFrequency: number; // its visit count
  path: {
    step: number; // 1..N
    from: string;
    to: string;
    weight?: number; // edge weight used on that hop (if weighted)
  }[];
};

export const randomWalk = createGraphAlgorithm<RandomWalkOutputData>({
  title: "Random Walk",
  description:
    "Traverses the graph by randomly selecting a neighbor to visit next. It continues for the specified number of steps.",
  inputs: [
    createAlgorithmSelectInput({
      id: "random-walk-start-node",
      label: "Start Node",
      source: "nodes",
      required: true,
    }),
    createNumberInput({
      id: "random-walk-steps",
      label: "Number of Steps",
      defaultValue: 10,
      min: 1,
      step: 1,
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1, arg2]) => {
    if (module) return module.random_walk(arg1, arg2);
  },
  output: (props) => <RandomWalk {...props} />,
});

function RandomWalk(props: GraphAlgorithmResult<RandomWalkOutputData>) {
  const { source, steps, weighted, maxFrequencyNode, maxFrequency, path } =
    props.data;
  return <p>Random Walk output: {JSON.stringify(props.data, null, 2)}</p>;
}

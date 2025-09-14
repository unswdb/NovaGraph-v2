import {
  createAlgorithmSelectInput,
  createNumberInput,
} from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type YenOutputData = {
  source: string;
  target: string;
  k: number;
  weighted: boolean;
  paths: {
    num: number;
    path: string[];
    weight?: number;
  }[];
};

export const yen = createGraphAlgorithm<YenOutputData>({
  title: "Yen's K Shortest Paths",
  description: "Finds the K shortest paths from one node to another",
  inputs: [
    createAlgorithmSelectInput({
      id: "yen-start-node",
      label: "Start Node",
      source: "nodes",
    }),
    createAlgorithmSelectInput({
      id: "yen-end-node",
      label: "End Node",
      source: "nodes",
    }),
    createNumberInput({
      id: "yen-k-paths",
      label: "K Paths",
      defaultValue: 3,
      min: 1,
    }),
  ],
  wasmFunction: (module, [arg1, arg2, arg3]) => {
    if (module) return module.yens_algorithm(arg1, arg2, arg3);
  },
  output: (props) => <Yen {...props} />,
});

function Yen(props: GraphAlgorithmResult<YenOutputData>) {
  const { source, target, k, weighted, paths } = props.data;
  return <p>Yen output</p>;
}

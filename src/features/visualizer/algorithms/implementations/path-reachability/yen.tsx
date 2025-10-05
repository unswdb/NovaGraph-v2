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
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
    createAlgorithmSelectInput({
      id: "yen-end-node",
      key: "end_node",
      displayName: "End Node",
      source: "nodes",
      required: true,
    }),
    createNumberInput({
      id: "yen-k-paths",
      key: "k_path",
      displayName: "K Paths",
      defaultValue: 3,
      min: 1,
      step: 1,
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1, arg2, arg3]) => {
    if (module) return module.yens_algorithm(arg1, arg2, arg3);
  },
  output: (props) => <Yen {...props} />,
});

function Yen(props: GraphAlgorithmResult<YenOutputData>) {
  const { source, target, k, weighted, paths } = props.data;
  return <p>Yen output: {JSON.stringify(props.data, null, 2)}</p>;
}

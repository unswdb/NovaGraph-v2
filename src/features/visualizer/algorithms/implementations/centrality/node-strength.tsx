import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import type { CentralityOutputData } from "./types";

type NodeStrengthCentralityOutputData = CentralityOutputData;

export const nodeStrengthCentrality =
  createGraphAlgorithm<NodeStrengthCentralityOutputData>({
    title: "Node Strength",
    description:
      "Measures the sum of the weights of the edges connected to a node.",
    inputs: [],
    wasmFunction: (module, _) => {
      //   if (module) return module.strength_centrality();
    },
    output: (props) => <NodeStrengthCentrality {...props} />,
  });

function NodeStrengthCentrality(
  props: GraphAlgorithmResult<NodeStrengthCentralityOutputData>
) {
  const { centralities } = props.data;
  return (
    <p>
      Node Strength Centrality output: {JSON.stringify(props.data, null, 2)}
    </p>
  );
}

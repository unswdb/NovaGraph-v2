import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import type { CentralityOutputData } from "./types";

type ClosenessCentralityOutputData = CentralityOutputData;

export const closenessCentrality =
  createGraphAlgorithm<ClosenessCentralityOutputData>({
    title: "Closeness Centrality",
    description:
      "Measures the average shortest path between a node and all other nodes.",
    inputs: [],
    wasmFunction: async (controller, _) => {
      //   if (module) return module.closeness_centrality();
    },
    output: (props) => <ClosenessCentrality {...props} />,
  });

function ClosenessCentrality(
  props: GraphAlgorithmResult<ClosenessCentralityOutputData>
) {
  const { centralities } = props.data;
  return (
    <p>Closeness Centrality output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

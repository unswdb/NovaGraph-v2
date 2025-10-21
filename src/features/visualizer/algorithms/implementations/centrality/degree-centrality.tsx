import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import type { CentralityOutputData } from "./types";

type DegreeCentralityOutputData = CentralityOutputData;

export const degreeCentrality =
  createGraphAlgorithm<DegreeCentralityOutputData>({
    title: "Degree Centrality",
    description: "Measures the number of edges connected to a node.",
    inputs: [],
    wasmFunction: async (controller, _) => {
      //   if (module) return module.degree_centrality();
    },
    output: (props) => <DegreeCentrality {...props} />,
  });

function DegreeCentrality(
  props: GraphAlgorithmResult<DegreeCentralityOutputData>
) {
  const { centralities } = props.data;
  return <p>Degree Centrality output: {JSON.stringify(props.data, null, 2)}</p>;
}

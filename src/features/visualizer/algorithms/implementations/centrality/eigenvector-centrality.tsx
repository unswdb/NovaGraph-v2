import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import type { CentralityOutputData } from "./types";

type EigenvectorCentralityOutputData = CentralityOutputData & {
  eigenvalue: number;
};

export const eigenvectorCentrality =
  createGraphAlgorithm<EigenvectorCentralityOutputData>({
    title: "Eigenvector Centrality",
    description: "Measures the influence of a node in a network.",
    inputs: [],
    wasmFunction: (module, _) => {
      if (module) return module.eigenvector_centrality();
    },
    output: (props) => <EigenvectorCentrality {...props} />,
  });

function EigenvectorCentrality(
  props: GraphAlgorithmResult<EigenvectorCentralityOutputData>
) {
  const { eigenvalue, centralities } = props.data;
  return (
    <p>Eigenvector Centrality output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

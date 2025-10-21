import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import type { CentralityOutputData } from "./types";

type HarmonicCentralityOutputData = CentralityOutputData;

export const harmonicCentrality =
  createGraphAlgorithm<HarmonicCentralityOutputData>({
    title: "Harmonic Centrality",
    description:
      "Measures the average harmonic mean of the shortest paths between a node to all other nodes.",
    inputs: [],
    wasmFunction: (module, _) => {
      //   if (module) return module.harmonic_centrality();
    },
    output: (props) => <HarmonicCentrality {...props} />,
  });

function HarmonicCentrality(
  props: GraphAlgorithmResult<HarmonicCentralityOutputData>
) {
  const { centralities } = props.data;
  return (
    <p>Harmonic Centrality output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";
import type { CentralityOutputData } from "./types";

type BetweennessCentralityOutputData = CentralityOutputData;

export const betweennessCentrality =
  createGraphAlgorithm<BetweennessCentralityOutputData>({
    title: "Betweenness Centrality",
    description:
      "Count how often a node lies on shortest paths between others.",
    inputs: [],
    wasmFunction: (module, _) => {
      if (module) return module.betweenness_centrality();
    },
    output: (props) => <BetweennessCentrality {...props} />,
  });

function BetweennessCentrality(
  props: GraphAlgorithmResult<BetweennessCentralityOutputData>
) {
  const { centralities } = props.data;
  return (
    <p>Betweenness Centrality output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

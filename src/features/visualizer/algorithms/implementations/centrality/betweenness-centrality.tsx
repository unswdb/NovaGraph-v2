import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";
import type { BetweennessCentralityOutputData } from "~/igraph/algorithms/Centrality/IgraphBetweenessCentrality";

export const betweennessCentrality =
  createGraphAlgorithm<BetweennessCentralityOutputData>({
    title: "Betweenness Centrality",
    description:
      "Count how often a node lies on shortest paths between others.",
    inputs: [],
    wasmFunction: async (controller, _) => {
      const algorithm = controller.getAlgorithm();
      if (algorithm === undefined) {
        throw new Error("Algorithm controller not initialized");
      }
      const result = await algorithm.betweennessCentrality();
      return {
        ...result,
        type: "algorithm" ,
      };
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

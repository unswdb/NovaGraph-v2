import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import type { CentralityOutputData } from "./types";

import { createNumberInput } from "~/features/visualizer/inputs";

type PageRankOutputData = CentralityOutputData & {
  damping: string;
};

export const pageRank = createGraphAlgorithm<PageRankOutputData>({
  title: "Page Rank",
  description: "Rank nodes by the importance of incoming connections.",
  inputs: [
    createNumberInput({
      id: "page-rank-damping",
      key: "damping_factor",
      displayName: "Damping Factor",
      defaultValue: 0.85,
      min: 0,
      max: 1,
      step: 0.01,
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1]) => {
    if (module) return module.pagerank(arg1);
  },
  output: (props) => <PageRank {...props} />,
});

function PageRank(props: GraphAlgorithmResult<PageRankOutputData>) {
  const { damping, centralities } = props.data;
  return <p>Page Rank output: {JSON.stringify(props.data, null, 2)}</p>;
}

import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

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
  wasmFunction: async (controller, [arg1]) => {
    // if (module) return module.pagerank(arg1);
  },
  output: (props) => <PageRank {...props} />,
});

function PageRank(props: GraphAlgorithmResult<PageRankOutputData>) {
  const { damping, centralities } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  const sortedCentralities = centralities.sort(
    (c1, c2) => c2.centrality - c1.centrality
  );

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Page Rank completed successfully
      </p>

      {/* Statistics */}
      {centralities.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-typography-secondary">
              Most Central Node:
            </span>
            <span className="text-typography-primary font-medium">
              {sortedCentralities[0].node}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-typography-secondary">
              Max Centrality Score:
            </span>
            <span className="text-typography-primary font-medium">
              {sortedCentralities[0].centrality.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-typography-secondary">Damping:</span>
            <span className="text-typography-primary font-medium">
              {damping}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-typography-secondary">Nodes Analyzed:</span>
            <span className="text-typography-primary font-medium">
              {sortedCentralities.length}
            </span>
          </div>
        </div>
      )}

      {/* Centralities */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Centralities</h3>
        <div className="max-h-80 overflow-y-auto border border-border rounded-md">
          <List
            rowComponent={PageRankRowComponent}
            rowCount={sortedCentralities.length + 1} // Top header row
            rowHeight={rowHeight}
            rowProps={{ centralities: sortedCentralities }}
          />
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            PageRank models a random surfer who follows links with probability{" "}
            <span className="font-medium">
              {(Number(damping) ?? 0.85) as any}
            </span>{" "}
            and “teleports” otherwise, nodes with more{" "}
            <span className="font-medium">high-quality incoming links</span>{" "}
            score higher.
          </li>
          <li>
            <span className="font-medium">{sortedCentralities[0]?.node}</span>{" "}
            ranks highest with score{" "}
            <span className="font-medium">
              {sortedCentralities[0]?.centrality.toFixed(2)}
            </span>
            .
          </li>
          <li>
            The <span className="font-medium">damping factor</span> controls how
            often the surfer teleports (typical ~0.85); lower values spread
            importance more uniformly.
          </li>
          <li>
            Direction and edge weights (if used) matter: strong or numerous
            inbound links from important pages amplify rank.
          </li>
          <li>
            Use PageRank to find{" "}
            <span className="font-medium">authoritative or trusted</span> nodes
            in citation, web, and influence graphs.
          </li>
        </ul>
      </div>
    </div>
  );
}

function PageRankRowComponent({
  index,
  style,
  centralities,
}: RowComponentProps<{
  centralities: PageRankOutputData["centralities"];
}>) {
  // Top header row
  if (index === 0) {
    return (
      <div
        key={index}
        className="bg-tabdock grid grid-flow-col auto-cols-fr"
        style={style}
      >
        <span className="font-semibold text-sm px-3 py-1.5">Rank</span>
        <span className="font-semibold text-sm px-3 py-1.5">Node</span>
        <span className="font-semibold text-sm px-3 py-1.5">Centrality</span>
      </div>
    );
  }

  const centrality = centralities[index - 1];
  return (
    <div
      key={index}
      className="grid grid-flow-col auto-cols-fr not-odd:bg-neutral-low/50"
      style={style}
    >
      <span className="px-3 py-1.5">{index}</span>
      <span className="px-3 py-1.5 truncate">{centrality.node}</span>
      <span className="px-3 py-1.5 truncate">
        {centrality.centrality.toFixed(2)}
      </span>
    </div>
  );
}

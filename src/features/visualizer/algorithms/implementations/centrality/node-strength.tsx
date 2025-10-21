import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

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
      if (module) return module.strength_centrality();
    },
    output: (props) => <NodeStrengthCentrality {...props} />,
  });

function NodeStrengthCentrality(
  props: GraphAlgorithmResult<NodeStrengthCentralityOutputData>
) {
  const { centralities } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  const sortedCentralities = centralities.sort(
    (c1, c2) => c2.centrality - c1.centrality
  );

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Node Strength Centrality completed successfully
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
          <div className="flex justify-between gap-2 col-span-2">
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
            rowComponent={NodeStrengthCentralityRowComponent}
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
            Node strength is the{" "}
            <span className="font-medium">sum of weights</span> of edges
            incident to a node, a weighted analogue of degree.
          </li>
          <li>
            Higher values indicate nodes with{" "}
            <span className="font-medium">many and/or heavy</span> connections
            (e.g., capacity, bandwidth, interaction volume).
          </li>
          <li>
            Top node is{" "}
            <span className="font-medium">{sortedCentralities[0]?.node}</span>{" "}
            with centrality of
            <span className="font-medium">
              {" "}
              {sortedCentralities[0]?.centrality.toFixed(2)}
            </span>
            .
          </li>
          <li>
            If your graph is unweighted, strength reduces to degree (each edge
            weight = 1).
          </li>
          <li>
            Good for ranking nodes by{" "}
            <span className="font-medium">aggregate connectivity</span> where
            edge weights matter.
          </li>
        </ul>
      </div>
    </div>
  );
}

function NodeStrengthCentralityRowComponent({
  index,
  style,
  centralities,
}: RowComponentProps<{
  centralities: NodeStrengthCentralityOutputData["centralities"];
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

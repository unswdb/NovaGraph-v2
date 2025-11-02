import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";
import type { EigenvectorCentralityOutputData } from "~/igraph/algorithms/Centrality/IgraphEigenvectorCentrality";

export const eigenvectorCentrality =
  createGraphAlgorithm<EigenvectorCentralityOutputData>({
    title: "Eigenvector Centrality",
    description: "Measures the influence of a node in a network.",
    inputs: [],
    wasmFunction: async (controller, _) => {
      const algorithm = controller.getAlgorithm();
      if (algorithm === undefined) {
        throw new Error("Algorithm controller not initialized");
      }
      const result = await algorithm.eigenvectorCentrality();
      return {
        ...result,
        type: "algorithm",
      };
    },
    output: (props) => <EigenvectorCentrality {...props} />,
  });

function EigenvectorCentrality(
  props: GraphAlgorithmResult<EigenvectorCentralityOutputData>
) {
  console.log("EigenvectorCentrality")

  const { eigenvalue, centralities } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  const sortedCentralities = centralities.sort(
    (c1, c2) => c2.centrality - c1.centrality
  );

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Eigenvector Centrality completed successfully
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
            <span className="text-typography-secondary">Eigenvalue:</span>
            <span className="text-typography-primary font-medium">
              {eigenvalue.toFixed(2)}
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
            rowComponent={EigenvectorCentralityRowComponent}
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
            Eigenvector centrality scores nodes higher when they are connected
            to <span className="font-medium">other high-scoring nodes</span>,
            influence is <em>recursive</em>.
          </li>
          <li>
            <span className="font-medium">{sortedCentralities[0]?.node}</span>{" "}
            ranks highest (
            <span className="font-medium">
              {sortedCentralities[0]?.centrality.toFixed(2)}
            </span>
            ), indicating connections into influential regions.
          </li>
          <li>
            The reported <span className="font-medium">eigenvalue</span>{" "}
            summarizes the leading factor of the network’s influence structure:{" "}
            <span className="font-medium">{eigenvalue.toFixed(2)}</span>.
          </li>
          <li>
            Useful for identifying{" "}
            <span className="font-medium">influencers</span> that are not just
            popular, but popular among the popular.
          </li>
          <li>
            Sensitive to graph direction/weights and to disconnected components;
            compare within the same dataset.
          </li>
        </ul>
      </div>
    </div>
  );
}

function EigenvectorCentralityRowComponent({
  index,
  style,
  centralities,
}: RowComponentProps<{
  centralities: EigenvectorCentralityOutputData["centralities"];
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

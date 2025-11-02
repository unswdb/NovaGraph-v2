import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";
import type { LocalClusteringCoefficientOutputData } from "~/igraph/algorithms/Community/IgraphLocalClusteringCoefficient";

export const localClusteringCoefficient =
  createGraphAlgorithm<LocalClusteringCoefficientOutputData>({
    title: "Local Clustering Coefficient",
    description:
      "Measures the number of triangles that pass through a node. Any nodes with a clustering coefficient of 0 are not part of any triangles.",
    inputs: [],
    wasmFunction: async (controller, _) => {
      const algorithm = controller.getAlgorithm();
      if (algorithm === undefined) {
        throw new Error("Algorithm controller not initialized");
      }
      const result = await algorithm.localClusteringCoefficient();
      return {
        ...result,
        type: "algorithm",
      };
    },
    output: (props) => <LocalClusteringCoefficient {...props} />,
  });

function LocalClusteringCoefficient(
  props: GraphAlgorithmResult<LocalClusteringCoefficientOutputData>
) {
  const { global_coefficient, coefficients } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Local Clustering Coefficient completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Global Coefficient:</span>
          <span className="text-typography-primary font-medium">
            {global_coefficient.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Nodes Analyzed:</span>
          <span className="text-typography-primary font-medium">
            {coefficients.length}
          </span>
        </div>
      </div>

      {/* Coefficients */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Coefficients</h3>
        {/* Rows */}
        <div className="max-h-80 overflow-y-auto border border-border rounded-md">
          <List
            rowComponent={LocalClusteringCoefficientRowComponent}
            rowCount={coefficients.length + 1} // Top header row
            rowHeight={rowHeight}
            rowProps={{ coefficients }}
          />
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            A node's local clustering coefficient measures how many{" "}
            <span className="font-medium">triangles</span> it participates in
            relative to how many could exist among its neighbors (range 0-1).
          </li>
          <li>
            The table lists each node's coefficient;{" "}
            <span className="font-medium">higher values</span> mean the node
            sits in a tightly knit neighborhood.
          </li>
          <li>
            <span className="font-medium">
              Global coefficient = {global_coefficient.toFixed(2)}
            </span>{" "}
            is the average across nodes (ignoring undefined cases), indicating
            overall triangle density.
          </li>
          <li>
            Use cases: spotting{" "}
            <span className="font-medium">cluster hubs</span>, measuring local
            cohesion, and comparing triangle-rich vs sparse regions.
          </li>
        </ul>
      </div>
    </div>
  );
}

function LocalClusteringCoefficientRowComponent({
  index,
  style,
  coefficients,
}: RowComponentProps<{
  coefficients: LocalClusteringCoefficientOutputData["coefficients"];
}>) {
  // Top header row
  if (index === 0) {
    return (
      <div key={index} className="grid grid-cols-2 bg-tabdock" style={style}>
        <span className="font-semibold text-sm px-3 py-1.5">Node</span>
        <span className="font-semibold text-sm px-3 py-1.5">Coefficient</span>
      </div>
    );
  }

  const coefficient = coefficients[index - 1];
  return (
    <div
      key={index}
      className="grid grid-cols-2 not-odd:bg-neutral-low/50"
      style={style}
    >
      {/* Layer Index */}
      <span className="px-3 py-1.5">{coefficient.node}</span>
      <span className="px-3 py-1.5">{coefficient.value.toFixed(2)}</span>
    </div>
  );
}

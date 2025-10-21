import { useState } from "react";
import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import InputComponent, {
  createEmptyInputResult,
  createSwitchInput,
} from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type MinimalSpanningTreeOutputData = {
  weighted: boolean;
  maxEdges: number; // ecount of original graph
  totalWeight?: number; // only if weighted (sum over MST edges)
  edges: {
    num: number; // 1-based order in returned MST list
    from: string;
    to: string;
    weight?: number;
  }[];
};

export const mst = createGraphAlgorithm<MinimalSpanningTreeOutputData>({
  title: "Minimum Spanning Tree",
  description:
    "Finds the subset of edges that connects all nodes in the graph with the minimum possible total edge weight.",
  inputs: [],
  wasmFunction: (module, _) => {
    // if (module) return module.min_spanning_tree();
  },
  output: (props) => <MinimalSpanningTree {...props} />,
});

function MinimalSpanningTree(
  props: GraphAlgorithmResult<MinimalSpanningTreeOutputData>
) {
  const { weighted, maxEdges, totalWeight, edges } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  const showWeightsInput = createSwitchInput({
    id: "mst-show-weights",
    key: "show_weights",
    displayName: "Show Weights",
    defaultValue: weighted ?? false,
    disabled: !weighted,
    showLabel: false,
  });

  const [showWeight, setShowWeight] = useState(
    createEmptyInputResult(showWeightsInput)
  );

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Minimum Spanning Tree completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">
            Number of Edges Selected:
          </span>
          <span className="text-typography-primary font-medium">
            {edges.length}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">
            Maximum Number of Edges:
          </span>
          <span className="text-typography-primary font-medium">
            {maxEdges}
          </span>
        </div>
        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">Total Weight:</span>
          <span className="text-typography-primary font-medium">
            {totalWeight ?? edges.length - 1}
          </span>
        </div>
      </div>

      {/* Edges */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Minimum Spanning Tree Edges</h3>
          <div className="flex gap-2">
            <span className="text-sm">Show Weight:</span>
            <InputComponent
              input={showWeightsInput}
              value={showWeight.value}
              onChange={setShowWeight}
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto border border-border rounded-md">
          <List
            rowComponent={MSTEdgeRowComponent}
            rowCount={edges.length + 1} // Top header row
            rowHeight={rowHeight}
            rowProps={{ showWeight: showWeight.value ?? false, edges }}
          />
        </div>
      </div>
    </div>
  );
}

function MSTEdgeRowComponent({
  index,
  style,
  showWeight,
  edges,
}: RowComponentProps<{
  showWeight: boolean;
  edges: MinimalSpanningTreeOutputData["edges"];
}>) {
  // Top header row
  if (index === 0) {
    return (
      <div
        key={index}
        className="bg-tabdock grid grid-flow-col auto-cols-fr"
        style={style}
      >
        <span className="font-semibold text-sm px-3 py-1.5">No.</span>
        <span className="font-semibold text-sm px-3 py-1.5">From</span>
        <span className="font-semibold text-sm px-3 py-1.5">To</span>
        {showWeight && (
          <span className="font-semibold text-sm px-3 py-1.5">Weight</span>
        )}
      </div>
    );
  }

  const edge = edges[index - 1];
  return (
    <div
      key={index}
      className="grid grid-flow-col auto-cols-fr not-odd:bg-neutral-low/50"
      style={style}
    >
      <span className="px-3 py-1.5">{edge.num}</span>
      <span className="px-3 py-1.5 truncate">{edge.from}</span>
      <span className="px-3 py-1.5 truncate">{edge.to}</span>
      {showWeight && (
        <span className="px-3 py-1.5">{edge.weight?.toFixed(2)}</span>
      )}
    </div>
  );
}

import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";
import { useState } from "react";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
  createSwitchInput,
} from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type DijkstraAToAllOutputData = {
  source: string;
  weighted: boolean;
  paths: { target: string; path: string[]; weight?: number }[];
};

export const dijkstraAToAll = createGraphAlgorithm<DijkstraAToAllOutputData>({
  title: "Dijkstra (A to All)",
  description: "Finds the shortest path from one node to all other nodes",
  inputs: [
    createAlgorithmSelectInput({
      id: "dijkstra-a-to-all-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: (module, [args]) => {
    if (module) return module.dijkstra_source_to_all(args);
  },
  output: (props) => <DijkstraAToAll {...props} />,
});

function DijkstraAToAll(props: GraphAlgorithmResult<DijkstraAToAllOutputData>) {
  const { source, weighted, paths } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  const showWeightsInput = createSwitchInput({
    id: "dijkstra-show-weights",
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
        ✓ Dijkstra A to All completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Source: <b className="text-typography-primary">{source}</b>
      </p>

      {/* Paths */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Traversal Paths</h3>
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
            rowComponent={DijkstraSingleSourcePathRowComponent}
            rowCount={paths.length + 1} // Top header row
            rowHeight={rowHeight}
            rowProps={{ showWeight: showWeight.value ?? false, paths }}
          />
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            Dijkstra computes the{" "}
            <span className="font-medium">minimum-weight path</span> from{" "}
            <span className="font-medium">{source}</span> to{" "}
            <span className="font-medium">every reachable node</span>, assuming{" "}
            <span className="font-medium">no negative edges</span>. With
            negative edges, use Bellman-Ford.
          </li>
          <li>
            Each row shows a target, its{" "}
            <span className="font-medium">hop count</span>, optional
            <span className="font-medium"> total weight</span>, and the{" "}
            <span className="font-medium">actual shortest-path sequence</span>.
          </li>
          <li>
            “Shortest” refers to{" "}
            <span className="font-medium">lowest total weight</span>, not
            necessarily the fewest hops.
          </li>
          <li>
            If a node doesn’t appear, it’s{" "}
            <span className="font-medium">unreachable</span> from the source
            under current edge directions/weights.
          </li>
        </ul>
      </div>
    </div>
  );
}

function DijkstraSingleSourcePathRowComponent({
  index,
  style,
  showWeight,
  paths,
}: RowComponentProps<{
  showWeight: boolean;
  paths: DijkstraAToAllOutputData["paths"];
}>) {
  // Top header row
  if (index === 0) {
    return (
      <div
        style={style}
        className={`bg-tabdock min-w-0 grid grid-flow-col ${
          showWeight ? "grid-cols-4" : "grid-cols-3"
        }`}
      >
        <span className="font-semibold text-sm px-3 py-1.5">Target</span>
        <span className="font-semibold text-sm px-3 py-1.5">Hops</span>
        {showWeight && (
          <span className="font-semibold text-sm px-3 py-1.5">Weight</span>
        )}
        <span className="font-semibold text-sm px-3 py-1.5">Shortest Path</span>
      </div>
    );
  }

  const path = paths[index - 1];

  return (
    <div
      style={style}
      className={`grid grid-flow-col ${
        showWeight ? "grid-cols-4" : "grid-cols-3"
      } not-odd:bg-neutral-low/50`}
    >
      <span className="font-semibold px-3 py-1.5">{path.target}</span>
      <span className="font-semibold px-3 py-1.5">{path.path.length}</span>

      {showWeight && (
        <span className="font-semibold px-3 py-1.5">
          {path.weight !== undefined ? path.weight.toFixed(2) : "—"}
        </span>
      )}

      {/* Nodes */}
      <span
        className={`flex gap-1 overflow-x-auto font-semibold px-3 py-1.5 ${
          showWeight && "col-span-2"
        }`}
      >
        {path.path.map((p, i) => (
          <div key={`${index}-${i}-${p}`} className="flex items-center">
            <span className="px-3 py-1.5 rounded-md bg-primary-low">{p}</span>
            {i < path.path.length - 1 && <span>→</span>}
          </div>
        ))}
      </span>
    </div>
  );
}

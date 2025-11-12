import { useState } from "react";
import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
  createSwitchInput,
} from "~/features/visualizer/inputs";
import type { BellmanFordAToAllOutputData } from "~/igraph/algorithms/PathFinding/IgraphBellmanFordAToAll";

export const bellmanFordAToAll =
  createGraphAlgorithm<BellmanFordAToAllOutputData>({
    title: "Bellman-Ford (A to All)",
    description:
      "Finds the shortest path from one node to all other nodes, even with negative weights",
    inputs: [
      createAlgorithmSelectInput({
        id: "bellman-ford-a-to-all-start-node",
        key: "start_node",
        displayName: "Start Node",
        source: "nodes",
        required: true,
      }),
    ],
    wasmFunction: async (igraphController, [arg1]) => {
      return await igraphController.bellmanFordAToAll(arg1);
    },
    output: (props) => <BellmanFordAToAll {...props} />,
  });

function BellmanFordAToAll(
  props: GraphAlgorithmResult<BellmanFordAToAllOutputData>
) {
  const { source, weighted, paths } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  const showWeightsInput = createSwitchInput({
    id: "bellman-ford-show-weights",
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
        ✓ Bellman Ford A to All completed successfully
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
            rowComponent={BFSingleSourcePathRowComponent}
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
            Bellman-Ford computes{" "}
            <span className="font-medium">
              shortest paths from {source} to all reachable nodes
            </span>
            , supporting{" "}
            <span className="font-medium">negative edge weights</span>.
          </li>
          <li>
            It’s useful when Dijkstra’s assumptions don’t hold (negative
            weights) and for graphs where edge costs may be penalties or
            credits.
          </li>
          <li>
            Each row shows the <span className="font-medium">target</span>, the
            number of <span className="font-medium">hops</span>, the total{" "}
            <span className="font-medium">path weight</span> (if enabled), and
            the <span className="font-medium">actual shortest path</span>{" "}
            sequence.
          </li>
          <li>
            Shortest paths minimize{" "}
            <span className="font-medium">total weight</span>, not hops. A path
            with more edges can still be cheaper than a shorter (in hops) path.
          </li>
          <li>
            If a <span className="font-medium">negative-weight cycle</span> is
            reachable from {source}, true shortest paths don’t exist. (This
            result assumes none were detected for the nodes shown)
          </li>
          <li>
            When weights are hidden or the graph is unweighted, each edge is
            effectively treated as cost <span className="font-medium">1</span>.
          </li>
        </ul>
      </div>
    </div>
  );
}

function BFSingleSourcePathRowComponent({
  index,
  style,
  showWeight,
  paths,
}: RowComponentProps<{
  showWeight: boolean;
  paths: BellmanFordAToAllOutputData["paths"];
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
            <span className="px-3 py-1.5 rounded-md text-nowrap bg-primary-low">
              {p}
            </span>
            {i < path.path.length - 1 && <span>→</span>}
          </div>
        ))}
      </span>
    </div>
  );
}

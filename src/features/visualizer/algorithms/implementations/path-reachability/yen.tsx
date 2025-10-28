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
  createNumberInput,
  createSwitchInput,
} from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type YenOutputData = {
  source: string;
  target: string;
  k: number;
  weighted: boolean;
  paths: {
    num: number;
    path: string[];
    weight?: number;
  }[];
};

export const yen = createGraphAlgorithm<YenOutputData>({
  title: "Yen's K Shortest Paths",
  description: "Finds the K shortest paths from one node to another",
  inputs: [
    createAlgorithmSelectInput({
      id: "yen-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
    createAlgorithmSelectInput({
      id: "yen-end-node",
      key: "end_node",
      displayName: "End Node",
      source: "nodes",
      required: true,
    }),
    createNumberInput({
      id: "yen-k-paths",
      key: "k_path",
      displayName: "K Paths",
      defaultValue: 3,
      min: 1,
      step: 1,
      required: true,
    }),
  ],
  wasmFunction: async (controller, [startId, endId, k]) => {
    const algorithm = controller.getAlgorithm();
    if (algorithm === undefined) {
      throw new Error("Algorithm controller not initialized");
    }
    const result = await algorithm.yenKShortestPaths(startId, endId, k);
    return {
      ...result,
      type: "algorithm" as const,
    };
  },
  output: (props) => <Yen {...props} />,
});

function Yen(props: GraphAlgorithmResult<YenOutputData>) {
  const { source, target, k, weighted, paths } = props.data;

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
        ✓ Yen's K Shortest Path completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Source:</span>
          <span className="text-typography-primary font-medium">{source}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Target</span>
          <span className="text-typography-primary font-medium">{target}</span>
        </div>
        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">
            Number of Paths (K):
          </span>
          <span className="text-typography-primary font-medium">{k}</span>
        </div>
      </div>

      {/* Paths */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Shortest Paths</h3>
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
            rowComponent={YenPathRowComponent}
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
            Yen’s algorithm lists the{" "}
            <span className="font-medium">K loopless shortest paths</span> from
            <span className="font-medium"> {source}</span> to{" "}
            <span className="font-medium">{target}</span>, ordered from lowest
            total weight to higher.
          </li>
          <li>
            “Loopless” means{" "}
            <span className="font-medium">no repeated nodes</span> within a
            single path; different paths may share segments.
          </li>
          <li>
            Yen's algorithm assumes{" "}
            <span className="font-medium">non-negative weights</span>.
          </li>
          <li>
            Each row shows the path’s <span className="font-medium">rank</span>,{" "}
            <span className="font-medium">hop count</span>,{" "}
            <span className="font-medium">total weight</span> (toggled), and the{" "}
            <span className="font-medium">node sequence</span>.
          </li>
          <li>
            <span className="font-medium">K = 1</span> matches the standard
            single shortest path (e.g., Dijkstra’s output on non-negative
            weights).
          </li>
          <li>
            Useful when you need{" "}
            <span className="font-medium">alternatives</span> for routing or
            resilience planning (e.g., if the best path is congested or
            unavailable).
          </li>
          <li>
            If weights are hidden or the graph is unweighted, paths are ranked
            by <span className="font-medium">hops</span> (each edge treated as
            cost 1).
          </li>
        </ul>
      </div>
    </div>
  );
}

function YenPathRowComponent({
  index,
  style,
  showWeight,
  paths,
}: RowComponentProps<{
  showWeight: boolean;
  paths: YenOutputData["paths"];
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
        <span className="font-semibold text-sm px-3 py-1.5">Rank</span>
        <span className="font-semibold text-sm px-3 py-1.5">Hops</span>
        {showWeight && (
          <span className="font-semibold text-sm px-3 py-1.5">Weight</span>
        )}
        <span className="font-semibold text-sm px-3 py-1.5">Path</span>
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
      <span className="font-semibold px-3 py-1.5">{path.num}</span>
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

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

// Infered from src/wasm/algorithms
type BellmanFordAToAllOutputData = {
  source: string;
  weighted: boolean;
  paths: {
    target: string;
    path: string[];
    weight?: number;
  }[];
};

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
    wasmFunction: (module, [args]) => {
      if (module) return module.bellman_ford_source_to_all(args);
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
    id: "random-walk-show-weights",
    key: "show_weights",
    displayName: "Show Weights",
    defaultValue: false,
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
          <h3 className="font-semibold">Traversal Path</h3>
          <div className="flex gap-2">
            <span className="text-sm">Show Weight:</span>
            <InputComponent
              input={showWeightsInput}
              value={showWeight.value}
              onChange={setShowWeight}
            />
          </div>
        </div>

        {/* Row Path */}
        <div className="max-h-80 overflow-y-auto border border-border rounded-md">
          <List
            rowComponent={BFSingleSourcePathRowComponent}
            rowCount={paths.length + 1} // Top header row
            rowHeight={rowHeight}
            rowProps={{ showWeight: showWeight.value ?? false, paths }}
          />
        </div>
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
            <span className="px-3 py-1.5 rounded-md bg-primary-low">{p}</span>
            {i < path.path.length - 1 && <span>→</span>}
          </div>
        ))}
      </span>
    </div>
  );
}

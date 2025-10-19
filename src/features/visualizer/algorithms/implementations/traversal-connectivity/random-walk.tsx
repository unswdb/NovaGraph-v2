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
  createNumberInput,
  createSwitchInput,
} from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type RandomWalkOutputData = {
  source: string;
  steps: number; // requested steps
  weighted: boolean;
  maxFrequencyNode: string; // node name with highest visits
  maxFrequency: number; // its visit count
  path: {
    step: number; // 1..N
    from: string;
    to: string;
    weight?: number; // edge weight used on that hop (if weighted)
  }[];
};

export const randomWalk = createGraphAlgorithm<RandomWalkOutputData>({
  title: "Random Walk",
  description:
    "Traverses the graph by randomly selecting a neighbor to visit next. It continues for the specified number of steps.",
  inputs: [
    createAlgorithmSelectInput({
      id: "random-walk-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
    createNumberInput({
      id: "random-walk-steps",
      key: "num_of_steps",
      displayName: "Number of Steps",
      defaultValue: 10,
      min: 1,
      step: 1,
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1, arg2]) => {
    if (module) return module.random_walk(arg1, arg2);
  },
  output: (props) => <RandomWalk {...props} />,
});

function RandomWalk(props: GraphAlgorithmResult<RandomWalkOutputData>) {
  const { source, steps, weighted, maxFrequencyNode, maxFrequency, path } =
    props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 36,
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
        ✓ Random Walk completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Source: <b className="text-typography-primary">{source}</b> • Steps:{" "}
        <b className="text-typography-primary">{steps}</b> • Max Frequency Node:{" "}
        <b className="text-typography-primary">
          {maxFrequencyNode} ({maxFrequency} times visited)
        </b>
      </p>

      {/* Layers */}
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
        <div className="border border-border border-collapse rounded-md overflow-hidden">
          {/* Header Row */}
          <div className="bg-tabdock grid grid-flow-col auto-cols-fr">
            <span className="font-semibold text-sm px-3 py-1.5">Step</span>
            <span className="font-semibold text-sm px-3 py-1.5">From</span>
            <span className="font-semibold text-sm px-3 py-1.5">To</span>
            {showWeight.value && (
              <span className="font-semibold text-sm px-3 py-1.5">Weight</span>
            )}
          </div>
          {/* Path */}
          <div className="max-h-80 overflow-y-auto">
            <List
              rowComponent={RandomWalkPathRowComponent}
              rowCount={path.length}
              rowHeight={rowHeight}
              rowProps={{ showWeight: showWeight.value ?? false, paths: path }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RandomWalkPathRowComponent({
  index,
  style,
  showWeight,
  paths,
}: RowComponentProps<{
  showWeight: boolean;
  paths: RandomWalkOutputData["path"];
}>) {
  const path = paths[index];
  return (
    <div
      key={index}
      className="grid grid-flow-col auto-cols-fr not-odd:bg-neutral-low/50"
      style={style}
    >
      <span className="font-semibold px-3 py-1.5">{path.step}</span>
      <span className="font-semibold px-3 py-1.5">{path.from}</span>
      <span className="font-semibold px-3 py-1.5">{path.to}</span>
      {showWeight && (
        <span className="font-semibold px-3 py-1.5">{path.weight}</span>
      )}
    </div>
  );
}

import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import {
  createAlgorithmSelectInput,
  createNumberInput,
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
  const { source, steps, maxFrequencyNode, maxFrequency, path } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 36,
  });

  const cumulative = path.reduce<number[]>((acc, step, i) => {
    const prev = acc[i - 1] ?? 0;
    acc.push(prev + (step.weight ?? 1));
    return acc;
  }, []);

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

      {/* Step By Step */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Traversal Path</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={RandomWalkPathRowComponent}
            rowCount={path.length}
            rowHeight={rowHeight}
            rowProps={{ cumulative, path }}
          />
        </div>
      </div>
    </div>
  );
}

function RandomWalkPathRowComponent({
  index,
  style,
  cumulative,
  path: paths,
}: RowComponentProps<{
  cumulative: number[];
  path: RandomWalkOutputData["path"];
}>) {
  const path = paths[index];
  return (
    <div key={index} style={style}>
      <div className="border border-border rounded-md px-4 py-3 space-y-1 mb-2">
        <div className="grid grid-cols-[36px_1fr_auto] gap-4">
          {/* Step number */}
          <p className="text-sm font-semibold">{path.step}</p>

          {/* Source to Target */}
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 h-full">
              <span className="max-w-1/2 px-3 py-1.5 rounded-md bg-primary-low text-sm truncate whitespace-nowrap">
                {path.from}
              </span>
              <span className="shrink-0">→</span>
              <span className="max-w-1/2 px-3 py-1.5 rounded-md bg-primary-low text-sm truncate whitespace-nowrap">
                {path.to}
              </span>
            </div>
          </div>

          {/* Weight */}
          <div className="text-right">
            <p className="font-semibold">+{path.weight ?? 1}</p>
            <p className="text-xs text-typography-secondary">Step weight</p>
          </div>
        </div>

        {/* Cumulative */}
        <p className="text-xs text-typography-secondary">
          Cumulative: {cumulative[index - 1] ?? 0} + {path.weight ?? 1} ={" "}
          <b>{cumulative[index]}</b>
        </p>
      </div>
    </div>
  );
}

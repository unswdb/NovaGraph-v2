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
import type { RandomWalkOutputData } from "~/igraph/algorithms/PathFinding/IgraphRandomWalk";

// Todo : more extensive testing
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
  wasmFunction: async (controller, [arg1, arg2]) => {
    const algorithm = controller.getAlgorithm();
    if (algorithm === undefined) {
      throw new Error("Algorithm controller not initialized");
    }
    const result = await algorithm.randomWalk(arg1, arg2);
    return {
      ...result,
      type: "algorithm" as const,
    };
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
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Source:</span>
          <span className="text-typography-primary font-medium">{source}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Number of Steps:</span>
          <span className="text-typography-primary font-medium">{steps}</span>
        </div>
        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">
            Node With Max Frequency:
          </span>
          <span className="text-typography-primary font-medium">
            {maxFrequencyNode} ({maxFrequency} times visited)
          </span>
        </div>
      </div>

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

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            A Random Walk simulates a step-by-step journey starting from{" "}
            <span className="font-medium">{source}</span>, where each next node
            is chosen randomly from its neighbors.
          </li>
          <li>
            It’s useful for analyzing{" "}
            <span className="font-medium">
              network diffusion, influence spread, and centrality
            </span>
            , showing how likely a node is to be revisited over time.
          </li>
          <li>
            The walk took <span className="font-medium">{steps}</span> steps,
            and <span className="font-medium">{maxFrequencyNode}</span> was
            visited <span className="font-medium">{maxFrequency}</span> times,
            indicating it has high connectivity or strong reachability.
          </li>
          <li>
            The traversal path shows the exact visit order, including repeated
            nodes, while cumulative weights track total distance or probability.
          </li>
          <li>
            Because choices are random, running the algorithm again can produce
            a different path and different visitation frequencies.
          </li>
        </ul>
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

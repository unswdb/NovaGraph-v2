import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type BellmanFordAToBOutputData = {
  source: string;
  target: string;
  weighted: boolean;
  path: {
    from: string;
    to: string;
    weight?: number;
  }[];
  totalWeight?: number;
};

export const bellmanFordAToB = createGraphAlgorithm<BellmanFordAToBOutputData>({
  title: "Bellman-Ford (A to B)",
  description:
    "Finds the shortest path from one node to another, even with negative weights",
  inputs: [
    createAlgorithmSelectInput({
      id: "bellman-ford-a-to-b-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
    createAlgorithmSelectInput({
      id: "bellman-ford-a-to-b-end-node",
      key: "end_node",
      displayName: "End Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: async (controller, [arg1, arg2]) => {
    // if (module) return module.bellman_ford_source_to_target(arg1, arg2);
  },
  output: (props) => <BellmanFordAToB {...props} />,
});

function BellmanFordAToB(
  props: GraphAlgorithmResult<BellmanFordAToBOutputData>
) {
  const { source, target, path, totalWeight } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  const cumulative = path.reduce<number[]>((acc, step, i) => {
    const prev = acc[i - 1] ?? 0;
    acc.push(prev + (step.weight ?? 1));
    return acc;
  }, []);

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Bellman Ford A to B completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Source:</span>
          <span className="text-typography-primary font-medium">{source}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Target:</span>
          <span className="text-typography-primary font-medium">{target}</span>
        </div>
        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">Total Weight:</span>
          <span className="text-typography-primary font-medium">
            {totalWeight ?? cumulative[path.length - 1]}
          </span>
        </div>
      </div>

      {/* Step By Step */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Step By Step</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={BFSinglePathRowComponent}
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
            Bellman-Ford finds the{" "}
            <span className="font-medium">minimum-weight path</span> from{" "}
            <span className="font-medium">{source}</span> to{" "}
            <span className="font-medium">{target}</span>, supporting{" "}
            <span className="font-medium">negative edge weights</span>.
          </li>
          <li>
            The “Step by Step” list shows the exact edge sequence and the{" "}
            <span className="font-medium">running total</span> of path cost.
          </li>
          <li>
            The reported <span className="font-medium">Total Weight</span> is
            the final minimum cost for reaching the target.
          </li>
          <li>
            Shortest means{" "}
            <span className="font-medium">lowest total weight</span>, not fewest
            hops.
          </li>
          <li>
            If a <span className="font-medium">negative-weight cycle</span> is
            on any route to the target, a true shortest path doesn’t exist.
            (This result assumes none were detected for the nodes shown)
          </li>
        </ul>
      </div>
    </div>
  );
}

function BFSinglePathRowComponent({
  index,
  style,
  cumulative,
  path: paths,
}: RowComponentProps<{
  cumulative: number[];
  path: BellmanFordAToBOutputData["path"];
}>) {
  const path = paths[index];
  return (
    <div key={index} style={style}>
      <div className="border border-border rounded-md px-4 py-3 space-y-1 mb-2">
        <div className="grid grid-cols-[36px_1fr_auto] gap-4">
          {/* Step number */}
          <p className="text-sm font-semibold">{index + 1}</p>

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

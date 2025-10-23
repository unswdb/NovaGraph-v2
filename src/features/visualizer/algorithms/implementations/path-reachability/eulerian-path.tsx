import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type EulerianPathOutputData = {
  start: string; // name of first vertex in sequence
  end: string; // name of last vertex in sequence
  path: {
    from: string;
    to: string;
    weight?: number;
  }[]; // consecutive steps
};

export const eulerianPath = createGraphAlgorithm<EulerianPathOutputData>({
  title: "Eulerian Path",
  description: "Finds a path that visits every edge exactly once.",
  inputs: [],
  wasmFunction: async (controller, _) => {
    // if (module) return module.eulerian_path();
  },
  output: (props) => <EulerianPath {...props} />,
});

function EulerianPath(props: GraphAlgorithmResult<EulerianPathOutputData>) {
  const { start, end, path } = props.data;

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
        ✓ Eulerian Path completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">First Vertex:</span>
          <span className="text-typography-primary font-medium">{start}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Last Vertex:</span>
          <span className="text-typography-primary font-medium">{end}</span>
        </div>
        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">Total Weight:</span>
          <span className="text-typography-primary font-medium">
            {cumulative[path.length - 1]}
          </span>
        </div>
      </div>

      {/* Step By Step */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Step By Step</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={EulerianPathRowComponent}
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
            An Eulerian path is a walk that{" "}
            <span className="font-medium">uses every edge exactly once</span>{" "}
            but doesn’t need to return to the start.
          </li>
          <li>
            The path here begins at <span className="font-medium">{start}</span>{" "}
            and ends at <span className="font-medium">{end}</span>, listing
            every traversed edge in order with the{" "}
            <span className="font-medium">running total</span>.
          </li>
          <li>
            Existence implies Eulerian path conditions (e.g., in undirected
            graphs,{" "}
            <span className="font-medium">
              exactly two vertices have odd degree
            </span>
            , all edges lie in one component).
          </li>
          <li>
            Practical use: you can plan a{" "}
            <span className="font-medium">single sweep</span> that covers all
            links without repetitions.
          </li>
        </ul>
      </div>
    </div>
  );
}

function EulerianPathRowComponent({
  index,
  style,
  cumulative,
  path: paths,
}: RowComponentProps<{
  cumulative: number[];
  path: EulerianPathOutputData["path"];
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

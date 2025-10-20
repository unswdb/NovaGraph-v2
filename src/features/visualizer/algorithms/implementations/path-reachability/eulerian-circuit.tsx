import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type EulerianCircuitOutputData = {
  path: {
    from: string;
    to: string;
    weight?: number;
  }[]; // consecutive steps
};

export const eulerianCircuit = createGraphAlgorithm<EulerianCircuitOutputData>({
  title: "Eulerian Circuit",
  description:
    "Finds a path that visits every edge exactly once and returns to the starting node.",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.eulerian_circuit();
  },
  output: (props) => <EulerianCircuit {...props} />,
});

function EulerianCircuit(
  props: GraphAlgorithmResult<EulerianCircuitOutputData>
) {
  const { path } = props.data;

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
        ✓ Eulerian Circuit completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Total Weight:{" "}
        <b className="text-typography-primary">{cumulative[path.length - 1]}</b>
      </p>

      {/* Step By Step */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Traversal Path</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={EulerianCircuitRowComponent}
            rowCount={path.length}
            rowHeight={rowHeight}
            rowProps={{ cumulative, path }}
          />
        </div>
      </div>
    </div>
  );
}

function EulerianCircuitRowComponent({
  index,
  style,
  cumulative,
  path: paths,
}: RowComponentProps<{
  cumulative: number[];
  path: EulerianCircuitOutputData["path"];
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

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { cn } from "~/lib/utils";
import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type CheckAdjacencyOutputData = {
  source: string;
  target: string;
  adjacent: boolean;
  weight?: number; // only if edge exists AND weights present
};

export const checkAdjacency = createGraphAlgorithm<CheckAdjacencyOutputData>({
  title: "Check Adjacency",
  description: "Checks to see if two nodes are connected by a single edge.",
  inputs: [
    createAlgorithmSelectInput({
      id: "check-adjacency-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
    createAlgorithmSelectInput({
      id: "check-adjacency-end-node",
      key: "end_node",
      displayName: "End Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1, arg2]) => {
    if (module) return module.vertices_are_adjacent(arg1, arg2);
  },
  output: (props) => <CheckAdjacency {...props} />,
});

function CheckAdjacency(props: GraphAlgorithmResult<CheckAdjacencyOutputData>) {
  const { source, target, adjacent, weight } = props.data;
  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Check Adjacency completed successfully
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold">Query Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-typography-secondary">Source:</span>
            <span className="text-typography-primary font-medium">
              {source}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-typography-secondary">Target:</span>
            <span className="text-typography-primary font-medium">
              {target}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Result</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-typography-secondary">Adjacent:</span>
            <span
              className={cn(
                "text-typography-primary font-medium",
                adjacent ? "text-positive" : "text-critical"
              )}
            >
              {adjacent ? "✓" : "✗"} {adjacent ? "Adjacent" : "Not Adjacent"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-typography-secondary">Edge Weight:</span>
            <span className="text-typography-primary font-medium">
              {weight != null ? weight : "Unweighted"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-typography-secondary">Edge Direction:</span>
            <span className="text-typography-primary font-medium">
              {source} → {target}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <p className="text-typography-secondary text-sm">
          {adjacent
            ? `✓ You can travel directly from ${source} to ${target} in one step`
            : `✗ You can't travel directly from ${source} to ${target} in one step`}
        </p>
      </div>
    </div>
  );
}

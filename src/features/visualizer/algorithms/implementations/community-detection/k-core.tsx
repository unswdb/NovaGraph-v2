import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createNumberInput } from "~/features/visualizer/inputs";
import type { KCoreOutputData } from "~/igraph/algorithms/Community/IgraphKCore";

export const kCore = createGraphAlgorithm<KCoreOutputData>({
  title: "K-Core Decomposition",
  description:
    "Finds groups of nodes where each has at least k neighbors within the group.",
  inputs: [
    createNumberInput({
      id: "k-core-k",
      key: "k",
      displayName: "K",
      defaultValue: 1,
      min: 1,
      step: 1,
      required: true,
    }),
  ],
  wasmFunction: async (igraphController, [arg1]) => {
    return await igraphController.kCore(arg1);
  },
  output: (props) => <KCore {...props} />,
});

function KCore(props: GraphAlgorithmResult<KCoreOutputData>) {
  const { k, max_coreness, cores } = props.data;
  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ K Core Decomposition completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">K:</span>
          <span className="text-typography-primary font-medium">{k}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Max Coreness:</span>
          <span className="text-typography-primary font-medium">
            {max_coreness}
          </span>
        </div>
        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">
            Number of Nodes in Core:
          </span>
          <span className="text-typography-primary font-medium">
            {cores.length}
          </span>
        </div>
      </div>

      {/* Nodes in 2-Core */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Nodes in Core</h3>
        <div className="max-h-80 overflow-auto">
          {cores.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cores.map((core, i) => (
                <span
                  key={`${i}-${core}`}
                  className="px-3 py-1.5 rounded-md bg-primary-low max-w-96 truncate whitespace-nowrap"
                >
                  {core.node}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-critical font-medium">
              No nodes in the graph has degree of {k}
            </p>
          )}
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            A <span className="font-medium">{k}-core</span> is the maximal set
            of nodes where every node has degree{" "}
            <span className="font-medium">≥ {k}</span>{" "}
            <em>within the induced subgraph</em>.
          </li>
          <li>
            The {cores.length} nodes listed form the{" "}
            <span className="font-medium">{k}-core</span>; removing any node
            would violate the degree threshold for someone in the set.
          </li>
          <li>
            <span className="font-medium">Max coreness = {max_coreness}</span>{" "}
            means the graph contains a non-empty{" "}
            <span className="font-medium">{max_coreness}-core</span>; higher
            coreness suggests a denser, more central nucleus.
          </li>
          <li>
            Use cases: peeling dense layers, identifying robust “core” regions,
            and seeding community/centrality analyses.
          </li>
        </ul>
      </div>
    </div>
  );
}

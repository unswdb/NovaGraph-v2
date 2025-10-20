import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createNumberInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type KCoreOutputData = {
  k: number;
  max_coreness: number; // max over all vertices
  cores: {
    id: number; // vertex id (original graph)
    node: string; // vertex name
  }[];
};

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
  wasmFunction: (module, [arg1]) => {
    if (module) return module.k_core(arg1);
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
        <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
          {cores.map((core, i) => (
            <span
              key={`${i}-${core}`}
              className="px-3 py-1.5 rounded-md bg-primary-low max-w-96 truncate whitespace-nowrap"
            >
              {core.node}
            </span>
          ))}
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            These {cores.length} nodes form a {k}-core
          </li>
          <li>Each node has at least {k} neighbors within this group</li>
          <li>
            This forms a triangle subgraph where every node has exactly {k}{" "}
            neighbors within the group
          </li>
          <li>
            Since max_coreness = {max_coreness}, the graph likely contains a{" "}
            {max_coreness}-core as well
          </li>
        </ul>
      </div>
    </div>
  );
}

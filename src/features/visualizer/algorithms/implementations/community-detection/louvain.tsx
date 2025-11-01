import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";
import { ChevronRight } from "lucide-react";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createNumberInput } from "~/features/visualizer/inputs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

// Infered from src/wasm/algorithms
type LouvainOutputData = {
  modularity: number;
  communities: string[][]; // index = community id, value = node-name[]
};

export const louvain = createGraphAlgorithm<LouvainOutputData>({
  title: "Louvain Algorithm",
  description:
    "Finds communities by maximizing modularity in a hierarchical way. Resolution determines the size of the communities, with higher values resulting in smaller communities.",
  inputs: [
    createNumberInput({
      id: "louvain-resolution",
      key: "resolution",
      displayName: "Resolution",
      defaultValue: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      required: true,
    }),
  ],
  wasmFunction: async (controller, [arg1]) => {
    // if (module) return module.louvain(arg1);
  },
  output: (props) => <Louvain {...props} />,
});

function Louvain(props: GraphAlgorithmResult<LouvainOutputData>) {
  const { modularity, communities } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Louvain Algorithm completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Modularity:{" "}
        <b className="text-typography-primary">{modularity.toFixed(2)}</b>
      </p>

      {/* Communities */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Communities</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={LouvainCommunityRowComponent}
            rowCount={communities.length}
            rowHeight={rowHeight}
            rowProps={{ communities }}
          />
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            Louvain hierarchically{" "}
            <span className="font-medium">maximizes modularity</span> to find
            communities—merging nodes/communities that improve the score.
          </li>
          <li>
            The shown modularity (
            <span className="font-medium">{modularity.toFixed(2)}</span>) rates
            how well the partition separates dense internal links from sparse
            external ones.
          </li>
          <li>
            Resolution tunes community size:{" "}
            <span className="font-medium">higher</span> → smaller communities;{" "}
            <span className="font-medium">lower</span> → larger ones.
          </li>
          <li>
            Good default for{" "}
            <span className="font-medium">modularity-based clustering</span>;
            consider Leiden for improved connectivity/stability.
          </li>
        </ul>
      </div>
    </div>
  );
}

function LouvainCommunityRowComponent({
  index,
  style,
  communities,
}: RowComponentProps<{ communities: LouvainOutputData["communities"] }>) {
  const community = communities[index];
  return (
    <div key={index} style={style}>
      <Collapsible
        defaultOpen={true}
        className="border border-primary-low rounded-md mb-2 transition-colors duration-150 hover:bg-primary-low/50"
      >
        <CollapsibleTrigger className="px-3 py-1.5 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Community {index + 1}</p>
            <span className="px-3 py-1.5 rounded-md text-xs bg-primary-low text-primary">
              {community.length} nodes
            </span>
          </div>
          <ChevronRight />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 py-2 flex flex-wrap gap-1">
          {community.map((c, i) => (
            <span
              key={`${index}-${i}-${c}`}
              className="px-3 py-1.5 rounded-md bg-primary-low"
            >
              {c}
            </span>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

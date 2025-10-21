import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createNumberInput } from "~/features/visualizer/inputs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

// Infered from src/wasm/algorithms
type LeidenOutputData = {
  modularity: number;
  quality: number;
  communities: string[][];
};

export const leiden = createGraphAlgorithm<LeidenOutputData>({
  title: "Leiden Algorithm",
  description:
    "Improved Louvain algorithm that ensures more stable and well-connected communities.",
  inputs: [
    createNumberInput({
      id: "leiden-resolution",
      key: "resolution",
      displayName: "Resolution",
      defaultValue: 0.25,
      min: 0.1,
      max: 2,
      step: 0.01,
      required: true,
    }),
  ],
  wasmFunction: (module, [arg1]) => {
    if (module) return module.leiden(arg1);
  },
  output: (props) => <Leiden {...props} />,
});

function Leiden(props: GraphAlgorithmResult<LeidenOutputData>) {
  const { modularity, quality, communities } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Leiden Algorithm completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Modularity:</span>
          <span className="text-typography-primary font-medium">
            {modularity.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Quality:</span>
          <span className="text-typography-primary font-medium">
            {quality.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Communities */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Communities</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={LeidenCommunityRowComponent}
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
            Leiden detects communities by iteratively{" "}
            <span className="font-medium">
              optimizing modularity (or a related quality)
            </span>{" "}
            while enforcing better connected, well-formed groups.
          </li>
          <li>
            <span className="font-medium">
              Modularity = {modularity.toFixed(2)}
            </span>{" "}
            and{" "}
            <span className="font-medium">Quality = {quality.toFixed(2)}</span>{" "}
            summarize the partition; compare values only on the{" "}
            <span className="font-medium">same graph and resolution</span>.
          </li>
          <li>
            Resolution controls granularity:{" "}
            <span className="font-medium">higher</span> → more/smaller
            communities; <span className="font-medium">lower</span> →
            fewer/larger.
          </li>
          <li>
            Use when you need{" "}
            <span className="font-medium">
              higher-quality, more stable partitions
            </span>{" "}
            than classic Louvain on complex graphs.
          </li>
        </ul>
      </div>
    </div>
  );
}

function LeidenCommunityRowComponent({
  index,
  style,
  communities,
}: RowComponentProps<{ communities: LeidenOutputData["communities"] }>) {
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

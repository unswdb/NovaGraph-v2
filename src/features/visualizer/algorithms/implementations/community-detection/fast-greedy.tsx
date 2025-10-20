import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";
import { ChevronRight } from "lucide-react";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

// Infered from src/wasm/algorithms
type FastGreedyOutputData = {
  modularity: number;
  communities: string[][];
};

export const fastGreedy = createGraphAlgorithm<FastGreedyOutputData>({
  title: "Fast Greedy Algorithm",
  description: "Builds communities by greedily optimizing modularity.",
  inputs: [],
  wasmFunction: (module, _) => {
    // if (module) return module.fast_greedy();
    return {
      colorMap: {
        "0": 0, // community assignments
        "1": 0,
        "2": 1,
        "3": 1,
      },
      mode: 2,
      data: {
        algorithm: "Fast-Greedy Community Detection",
        modularity: 0.39, // maximum modularity achieved
        communities: [
          ["NodeA", "NodeB"],
          ["NodeC", "NodeD"],
        ],
      },
    };
  },
  output: (props) => <FastGreedy {...props} />,
});

function FastGreedy(props: GraphAlgorithmResult<FastGreedyOutputData>) {
  const { modularity, communities } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Fast Greedy completed successfully
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
            rowComponent={FastGreedyCommunityRowComponent}
            rowCount={communities.length}
            rowHeight={rowHeight}
            rowProps={{ communities }}
          />
        </div>
      </div>
    </div>
  );
}

function FastGreedyCommunityRowComponent({
  index,
  style,
  communities,
}: RowComponentProps<{ communities: FastGreedyOutputData["communities"] }>) {
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

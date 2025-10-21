import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

// Infered from src/wasm/algorithms
type LabelPropagationOutputData = {
  communities: string[][];
};

export const labelPropagation =
  createGraphAlgorithm<LabelPropagationOutputData>({
    title: "Label Propagation",
    description:
      "Assigns nodes to communities based on their labels. Results may vary between runs due to the randomness of the algorithm.",
    inputs: [],
    wasmFunction: (module, _) => {
      if (module) return module.label_propagation();
    },
    output: (props) => <LabelPropagation {...props} />,
  });

function LabelPropagation(
  props: GraphAlgorithmResult<LabelPropagationOutputData>
) {
  const { communities } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Label Propagation completed successfully
      </p>

      {/* Communities */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Communities</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={LabelPropagationCommunityRowComponent}
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
            Label Propagation assigns communities by letting nodes adopt the{" "}
            <span className="font-medium">
              most common label among neighbors
            </span>{" "}
            until labels stabilize.
          </li>
          <li>
            The listed communities are the final labels; results can{" "}
            <span className="font-medium">vary between runs</span> due to random
            tie-breaking.
          </li>
          <li>
            Fast and scalable: good for large graphs when you need a{" "}
            <span className="font-medium">quick partition</span> without
            optimizing a global objective like modularity.
          </li>
        </ul>
      </div>
    </div>
  );
}

function LabelPropagationCommunityRowComponent({
  index,
  style,
  communities,
}: RowComponentProps<{
  communities: LabelPropagationOutputData["communities"];
}>) {
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

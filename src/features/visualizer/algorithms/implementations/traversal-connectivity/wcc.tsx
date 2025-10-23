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
type WCCOutputData = {
  components: string[][]; // index = component id, value = node-name[]
};

export const wcc = createGraphAlgorithm<WCCOutputData>({
  title: "Weakly Connected (WCC)",
  description: "Finds the weakly connected components in a graph.",
  inputs: [],
  wasmFunction: async (controller, _) => {
    // if (module) return module.weakly_connected_components();
  },
  output: (props) => <WCC {...props} />,
});

function WCC(props: GraphAlgorithmResult<WCCOutputData>) {
  const { components } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Weakly Connected Components (WCC) completed successfully
      </p>

      {/* Components */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Components</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={WCCRowComponent}
            rowCount={components.length}
            rowHeight={rowHeight}
            rowProps={{ components }}
          />
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            Weakly Connected Components (WCCs) partition an{" "}
            <span className="font-medium">undirected</span> graph into groups
            that are connected.
          </li>
          <li>
            This is useful for understanding{" "}
            <span className="font-medium">coarse connectivity</span>,
            discovering islands of nodes that belong together.
          </li>
          <li>
            We found <span className="font-medium">{components.length}</span>{" "}
            component{components.length !== 1 ? "s" : ""}. Each listed
            “Component” contains nodes that are mutually reachable.
          </li>
          <li>
            Nodes in the <span className="font-medium">same component</span>{" "}
            share at least one undirected path between them; nodes in{" "}
            <span className="font-medium">different components</span> do not.
          </li>
          <li>
            Relationship to SCC:{" "}
            <span className="font-medium">SCCs are finer</span> than WCCs. Each
            SCC lies entirely inside a single WCC; a WCC may contain multiple
            SCCs.
          </li>
          <li>
            In an <span className="font-medium">undirected</span> graph, WCCs
            are exactly the usual connected components.
          </li>
        </ul>
      </div>
    </div>
  );
}

function WCCRowComponent({
  index,
  style,
  components,
}: RowComponentProps<{ components: WCCOutputData["components"] }>) {
  const component = components[index];
  return (
    <div key={index} style={style}>
      <Collapsible
        defaultOpen={true}
        className="border border-primary-low rounded-md mb-2 transition-colors duration-150 hover:bg-primary-low/50"
      >
        <CollapsibleTrigger className="px-3 py-1.5 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Component {index + 1}</p>
            <span className="px-3 py-1.5 rounded-md text-xs bg-primary-low text-primary">
              {component.length} nodes
            </span>
          </div>
          <ChevronRight />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 py-2 flex flex-wrap gap-1">
          {component.map((c, i) => (
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

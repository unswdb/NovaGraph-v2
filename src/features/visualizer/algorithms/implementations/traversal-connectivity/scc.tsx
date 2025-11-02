import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";
import { ChevronRight } from "lucide-react";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";
import type { SCCOutputData } from "~/igraph/algorithms/Community/IgraphStronglyConnectedComponents";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

export const scc = createGraphAlgorithm<SCCOutputData>({
  title: "Strongly Connected (SCC)",
  description: "Finds the strongly connected components in a graph.",
  inputs: [],
  wasmFunction: async (controller, _) => {
    const algorithm = controller.getAlgorithm();
    if (algorithm === undefined) {
      throw new Error("Algorithm controller not initialized");
    }
    const result = await algorithm.stronglyConnectedComponents();
    return {
      ...result,
      type: "algorithm",
    };
  },
  output: (props) => <SCC {...props} />,
});

function SCC(props: GraphAlgorithmResult<SCCOutputData>) {
  const { components } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Strongly Connected Components (SCC) completed successfully
      </p>

      {/* Components */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Components</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={SCCRowComponent}
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
            Strongly Connected Components (SCCs) partition a{" "}
            <span className="font-medium">directed</span> graph into groups
            where every node can reach every other node by following edge
            directions.
          </li>
          <li>
            This is useful for understanding{" "}
            <span className="font-medium">
              cyclic structure, mutual reachability, and module/grouping
            </span>{" "}
            in directed networks (e.g., dependency cycles, bidirectional link
            clusters).
          </li>
          <li>
            We found <span className="font-medium">{components.length}</span>{" "}
            component{components.length !== 1 ? "s" : ""}. Each listed
            “Component” shows all nodes that are mutually reachable.
          </li>
          <li>
            Nodes in the <span className="font-medium">same component</span> can
            reach each other (both directions). Nodes in{" "}
            <span className="font-medium">different components</span> do not
            have mutual reachability.
          </li>
          <li>
            Collapsing each SCC into a single super-node yields a{" "}
            <span className="font-medium">DAG (acyclic)</span>, which can be
            analyzed or topologically ordered.
          </li>
          <li>
            In an <span className="font-medium">undirected</span> graph, SCCs
            coincide with connected components; single-node SCCs indicate nodes
            with no cycle-reachable peers.
          </li>
        </ul>
      </div>
    </div>
  );
}

function SCCRowComponent({
  index,
  style,
  components,
}: RowComponentProps<{ components: SCCOutputData["components"] }>) {
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

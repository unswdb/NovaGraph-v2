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
type SCCOutputData = {
  components: string[][]; // index = component id, value = node-name[]
};

export const scc = createGraphAlgorithm<SCCOutputData>({
  title: "Strongly Connected (SCC)",
  description: "Finds the strongly connected components in a graph.",
  inputs: [],
  wasmFunction: async (controller, _) => {
    // if (module) return module.strongly_connected_components();
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

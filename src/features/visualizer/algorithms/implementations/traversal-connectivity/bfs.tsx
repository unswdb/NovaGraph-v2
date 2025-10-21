import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type BFSOutputData = {
  source: string;
  nodesFound: number;
  layers: { layer: string[]; index: number }[];
};

export const bfs = createGraphAlgorithm<BFSOutputData>({
  title: "Breadth-First Search",
  description:
    "Traverses the graph from a source by exploring all neighbors level by level. It continues until all nodes are visited.",
  inputs: [
    createAlgorithmSelectInput({
      id: "bfs-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: (controller, [args]) => {
    // if (module) return module.bfs(args);
  },
  output: (props) => <BFS {...props} />,
});

function BFS(props: GraphAlgorithmResult<BFSOutputData>) {
  const { source, nodesFound, layers } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ BFS completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Source:</span>
          <span className="text-typography-primary font-medium">{source}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Nodes Found:</span>
          <span className="text-typography-primary font-medium">
            {nodesFound}
          </span>
        </div>
        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">Number of Layers:</span>
          <span className="text-typography-primary font-medium">
            {layers.length}
          </span>
        </div>
      </div>

      {/* Layers */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Layers</h3>
        {/* Rows */}
        <div className="max-h-80 overflow-y-auto border border-border rounded-md">
          <List
            rowComponent={BFSLayerRowComponent}
            rowCount={layers.length + 1} // Top header row
            rowHeight={rowHeight}
            rowProps={{ layers }}
          />
        </div>
      </div>
    </div>
  );
}

function BFSLayerRowComponent({
  index,
  style,
  layers,
}: RowComponentProps<{ layers: BFSOutputData["layers"] }>) {
  // Top header row
  if (index === 0) {
    return (
      <div key={index} className="grid grid-cols-3 bg-tabdock" style={style}>
        <span className="font-semibold text-sm px-3 py-1.5">Layer Index</span>
        <span className="col-span-2 font-semibold text-sm px-3 py-1.5">
          Nodes in Layer
        </span>
      </div>
    );
  }

  const layer = layers[index - 1];
  return (
    <div
      key={index}
      className="grid grid-cols-3 not-odd:bg-neutral-low/50"
      style={style}
    >
      {/* Layer Index */}
      <span className="font-semibold px-3 py-1.5">{layer.index}</span>
      {/* Nodes */}
      <span className="col-span-2 flex flex-wrap gap-1 font-semibold px-3 py-1.5">
        {layer.layer.map((layer, i) => (
          <span
            key={`${index}-${i}-${layer}`}
            className="px-3 py-1.5 rounded-md bg-primary-low"
          >
            {layer}
          </span>
        ))}
      </span>
    </div>
  );
}

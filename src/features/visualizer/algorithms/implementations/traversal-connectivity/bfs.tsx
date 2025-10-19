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
  wasmFunction: (module, [args]) => {
    if (module) return module.bfs(args);
  },
  output: (props) => <BFS {...props} />,
});

function BFS(props: GraphAlgorithmResult<BFSOutputData>) {
  const { source, nodesFound, layers } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 50,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ BFS completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Source: <b className="text-typography-primary">{source}</b> • Nodes
        Found: <b className="text-typography-primary">{nodesFound}</b> • Layers:{" "}
        <b className="text-typography-primary">{layers.length}</b>
      </p>

      {/* Layers */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Traversal Layers</h3>
        <div className="border border-border border-collapse rounded-md overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-3 bg-tabdock">
            <span className="font-semibold text-sm px-3 py-1.5">
              Layer Index
            </span>
            <span className="col-span-2 font-semibold text-sm px-3 py-1.5">
              Nodes in Layer
            </span>
          </div>
          {/* Rows */}
          <div className="max-h-80 overflow-y-auto">
            <List
              rowComponent={BFSLayerRowComponent}
              rowCount={layers.length}
              rowHeight={rowHeight}
              rowProps={{ layers }}
            />
          </div>
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
  const layer = layers[index];
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

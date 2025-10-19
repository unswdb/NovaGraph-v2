import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";

// Infered from src/wasm/algorithms
type DFSOutputData = {
  source: string;
  nodesFound: number;
  subtrees: { num: number; tree: string[] }[];
};

export const dfs = createGraphAlgorithm<DFSOutputData>({
  title: "Depth-First Search",
  description:
    "Traverses the graph from a source by exploring as far as possible along one branch before backtracking. It continues until all nodes are visited.",
  inputs: [
    createAlgorithmSelectInput({
      id: "dfs-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: (module, [args]) => {
    if (module) return module.dfs(args);
  },
  output: (props) => <DFS {...props} />,
});

function DFS(props: GraphAlgorithmResult<DFSOutputData>) {
  const { source, nodesFound, subtrees } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ DFS completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Source: <b className="text-typography-primary">{source}</b> • Nodes
        Found: <b className="text-typography-primary">{nodesFound}</b> •
        Subtrees: <b className="text-typography-primary">{subtrees.length}</b>
      </p>

      {/* Subtrees */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Traversal Layers</h3>
        <div className="border border-border border-collapse rounded-md overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-3 bg-tabdock">
            <span className="font-semibold text-sm px-3 py-1.5">
              Subtree Index
            </span>
            <span className="col-span-2 font-semibold text-sm px-3 py-1.5">
              Nodes in Subtree
            </span>
          </div>
          {/* Rows */}
          <div className="max-h-80 overflow-y-auto">
            <List
              rowComponent={DFSSubtreeRowComponent}
              rowCount={subtrees.length}
              rowHeight={rowHeight}
              rowProps={{ subtrees }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DFSSubtreeRowComponent({
  index,
  style,
  subtrees,
}: RowComponentProps<{
  subtrees: DFSOutputData["subtrees"];
}>) {
  const subtree = subtrees[index];
  return (
    <div className="grid grid-cols-3 not-odd:bg-neutral-low/50" style={style}>
      {/* Layer Index */}
      <span className="font-semibold px-3 py-1.5">{subtree.num}</span>
      {/* Nodes */}
      <span className="col-span-2 flex flex-wrap gap-1 font-semibold px-3 py-1.5">
        {subtree.tree.map((tree, i) => (
          <div key={`${index}-${i}-${tree}`} className="py-1.5">
            <span className="px-3 py-1.5 rounded-md bg-primary-low">
              {tree}
            </span>
            {i < subtree.tree.length - 1 && <span>→</span>}
          </div>
        ))}
      </span>
    </div>
  );
}

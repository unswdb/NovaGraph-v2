import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import type { DFSOutputData } from "~/igraph/algorithms/PathFinding/IgraphDFS";

// type moved to igraph layer

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
  wasmFunction: async (controller, [args]) => {
    const algorithm = controller.getAlgorithm();
    if (algorithm === undefined) {
      throw new Error("Algorithm controller not initialized");
    }
    const result = await algorithm.dfs(args);
    return {
      ...result,
      type: "algorithm" as const,
    };
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
          <span className="text-typography-secondary">Number of Subtrees:</span>
          <span className="text-typography-primary font-medium">
            {subtrees.length}
          </span>
        </div>
      </div>

      {/* Subtrees */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Subtrees</h3>
        <div className="max-h-80 overflow-y-auto border border-border rounded-md">
          <List
            rowComponent={DFSSubtreeRowComponent}
            rowCount={subtrees.length + 1} // Top header row
            rowHeight={rowHeight}
            rowProps={{ subtrees }}
          />
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            Depth-First Search (DFS) explores as deep as possible along each
            path from <span className="font-medium">{source}</span> before
            backtracking and continuing with other branches.
          </li>
          <li>
            It’s used to uncover{" "}
            <span className="font-medium">
              connectivity, traversal order, and graph structure
            </span>
            , forming a DFS forest if the graph isn’t fully connected.
          </li>
          <li>
            <span className="font-medium">{nodesFound}</span> nodes were
            visited, forming{" "}
            <span className="font-medium">{subtrees.length}</span> subtree
            {subtrees.length !== 1 ? "s" : ""} in total.
          </li>
          <li>
            Each subtree shows the sequence of nodes explored before
            backtracking from root to leaves.
          </li>
          <li>
            DFS does{" "}
            <span className="font-medium">not guarantee shortest paths</span>,
            but reveals how the graph can be reached through recursive
            exploration.
          </li>
        </ul>
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
  // Top header row
  if (index === 0) {
    return (
      <div key={index} className="grid grid-cols-3 bg-tabdock" style={style}>
        <span className="font-semibold text-sm px-3 py-1.5">Subtree Index</span>
        <span className="col-span-2 font-semibold text-sm px-3 py-1.5">
          Nodes in Subtree
        </span>
      </div>
    );
  }

  const subtree = subtrees[index - 1];
  return (
    <div
      key={index}
      className="grid grid-cols-3 not-odd:bg-neutral-low/50"
      style={style}
    >
      {/* Layer Index */}
      <span className="font-semibold px-3 py-1.5">{subtree.num}</span>
      {/* Nodes */}
      <span className="col-span-2 flex gap-1 overflow-x-auto font-semibold px-3 py-1.5">
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

import type { GraphEdge, GraphNode } from "../../../types";
import AddEdge from "./add-edge";
import EdgeListItem from "./edge-list-item";

export default function EdgesList({
  node,
  nodesMap,
  outgoingEdges,
  directed,
}: {
  node: GraphNode;
  nodesMap: Record<string, GraphNode>;
  outgoingEdges: [GraphNode, GraphEdge][];
  directed: boolean;
}) {
  return (
    <>
      <div className="space-y-4">
        {/* Edge List */}
        <div className="space-y-2">
          {outgoingEdges.length > 0 ? (
            outgoingEdges.map(([targetNode, targetEdge], index) => (
              <EdgeListItem
                key={index}
                source={node}
                target={targetNode}
                edge={targetEdge}
                directed={directed}
              />
            ))
          ) : (
            <span className="block text-sm text-center text-typography-tertiary">
              No outgoing edges
            </span>
          )}
        </div>
      </div>
      {/* Add Edge */}
      <AddEdge
        source={node}
        nodesMap={nodesMap}
        outgoingEdges={outgoingEdges}
        directed={directed}
      />
    </>
  );
}

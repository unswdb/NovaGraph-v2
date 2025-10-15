import { useStore } from "~/features/visualizer/hooks/use-store";
import type { EdgeSchema, GraphEdge, GraphNode } from "../../../types";
import CreateEdge from "./create-edge";
import EdgeListItem from "./edge-list-item";

export default function EdgesList({
  node,
  outgoingEdges,
  directed,
  onClose
}: {
  node: GraphNode;
  outgoingEdges: [GraphNode, GraphEdge][];
  directed: boolean;
  onClose: () => void;
}) {
  const { database } = useStore();
  const { edgeTablesMap } = database.graph;
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
                edgeSchema={
                  edgeTablesMap.get(targetEdge.tableName) as EdgeSchema
                }
                directed={directed}
                onClose={onClose}
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
      <CreateEdge
        source={node}
        outgoingEdges={outgoingEdges}
        directed={directed}
        onClose={onClose}
      />
    </>
  );
}

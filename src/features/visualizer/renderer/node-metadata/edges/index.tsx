import type { GraphEdge, GraphNode } from "../../../types";
import { Button } from "~/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResults,
} from "../../../inputs";
import { useMemo, useState } from "react";
import EdgesDialog from "./edges-dialog";
import AddEdgeDialog from "./add-edge-dialog";

export default function EdgesList({
  node,
  outgoingEdges,
  directed,
}: {
  node: GraphNode;
  outgoingEdges: [GraphNode, GraphEdge][];
  directed: boolean;
}) {
  const addEdgeInput = createAlgorithmSelectInput({
    id: "add-edge-target-node",
    label: "Target Node",
    source: "nodes",
    blacklist: [node, ...outgoingEdges.map((e) => e[0])],
    required: true,
    showLabel: false,
  });

  const [values, setValues] = useState(createEmptyInputResults([addEdgeInput]));
  const [status, setStatus] = useState({
    enableAddEdge: false,
    addingEdge: false,
  });

  const isReadyToAddEdge = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleDeleteEdge
  const handleDeleteEdge = (node1: GraphNode, node2: GraphNode) => {
    toast.success("Edge deleted (not really, yet!)");
  };

  return (
    <div className="space-y-4">
      {/* Edge List */}
      <div className="space-y-2">
        {outgoingEdges.length > 0 ? (
          outgoingEdges.map(([targetNode, targetEdge]) => (
            <EdgesDialog
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
      {!status.enableAddEdge && !status.addingEdge && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setStatus({
              enableAddEdge: true,
              addingEdge: false,
            });
          }}
        >
          <Plus /> Add Edge
        </Button>
      )}
      {!!status.enableAddEdge && !status.addingEdge && (
        <div className="w-full flex items-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setStatus({
                enableAddEdge: false,
                addingEdge: false,
              })
            }
          >
            <X />
          </Button>
          <div className="flex-1">
            <InputComponent
              input={addEdgeInput}
              value={values[addEdgeInput.label]?.value}
              onChange={(value) =>
                setValues((prev) => ({
                  ...prev,
                  [addEdgeInput.label]: value,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-1">
            {!!values[addEdgeInput.label].value && (
              <AddEdgeDialog
                source={node}
                target={values[addEdgeInput.label].value}
                directed={directed}
                trigger={
                  <Button size="icon" disabled={!isReadyToAddEdge}>
                    <Plus />
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

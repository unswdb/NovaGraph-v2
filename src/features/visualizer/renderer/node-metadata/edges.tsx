import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import type { GraphNode } from "../../types";
import { Button } from "~/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResults,
} from "../../inputs";
import { useMemo, useState } from "react";
import type { InputChangeResult } from "../../inputs/types";

export default function EdgesList({
  node,
  outgoingEdges,
}: {
  node: GraphNode;
  outgoingEdges: GraphNode[];
}) {
  const addEdgeInput = createAlgorithmSelectInput({
    id: "add-edge-target-node",
    label: "Target Node",
    source: "nodes",
    blacklist: [node, ...outgoingEdges],
    required: true,
    showLabel: false,
  });

  const [values, setValues] = useState<Record<string, InputChangeResult>>(
    createEmptyInputResults([addEdgeInput])
  );
  const [status, setStatus] = useState({
    enableAddEdge: false,
    addingEdge: false,
  });

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleDeleteEdge
  const handleDeleteEdge = (node1: GraphNode, node2: GraphNode) => {
    toast.success("Edge deleted (not really, yet!)");
  };

  // TODO: Implement handleAddEdge
  const handleAddEdge = (node1: GraphNode, node2: GraphNode) => {
    toast.success("Edge added (not really, yet!)");
  };

  return (
    <div className="space-y-4">
      {/* Edge List */}
      <div className="space-y-2">
        {outgoingEdges.length > 0 ? (
          outgoingEdges.map((edgeNode) => (
            <div
              key={edgeNode.id}
              className="px-2 flex items-center justify-between gap-1"
            >
              {edgeNode.label ? (
                <span className="truncate">
                  {edgeNode.label}{" "}
                  <span className="text-typography-tertiary">
                    (ID: {edgeNode.id})
                  </span>
                </span>
              ) : (
                <span className="truncate">{edgeNode.id}</span>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost">
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete this edge?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the edge between the two
                      nodes. The nodes themselves will remain in the graph. The
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteEdge(node, edgeNode)}
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
            <Button
              size="icon"
              disabled={!isReadyToSubmit}
              onClick={() => {
                const targetNode = values[addEdgeInput.label]
                  ?.value as GraphNode;
                if (!targetNode) return;
                handleAddEdge(node, targetNode);
              }}
            >
              <Plus />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

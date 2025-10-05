import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResults,
} from "~/features/visualizer/inputs";
import type { GraphEdge, GraphNode } from "~/features/visualizer/types";
import AddEdgeDialog from "./add-edge-dialog";
import { useStore } from "~/features/visualizer/hooks/use-store";

export default function AddEdge({
  source,
  outgoingEdges,
  directed,
}: {
  source: GraphNode;
  outgoingEdges: [GraphNode, GraphEdge][];
  directed: boolean;
}) {
  const { database } = useStore();
  const { nodesMap } = database.graph;

  const addEdgeInput = createAlgorithmSelectInput({
    id: "add-edge-target-node",
    label: "Target Node",
    source: "nodes",
    blacklist: [source, ...outgoingEdges.map((e) => e[0])],
    required: true,
    showLabel: false,
  });

  const [values, setValues] = useState(createEmptyInputResults([addEdgeInput]));
  const [status, setStatus] = useState({
    addingEdge: false,
    edgeAdded: false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const isReadyToAddEdge = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  const target = useMemo(() => {
    const id = values[addEdgeInput.label].value;
    if (!id) return null;
    return nodesMap.get(id) ?? null;
  }, [nodesMap, values[addEdgeInput.label].value]);

  const onClose = () => {
    setDialogOpen(false);
    setValues(createEmptyInputResults([addEdgeInput]));
  };

  if (!status.addingEdge && !status.edgeAdded) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() =>
          setStatus({
            addingEdge: true,
            edgeAdded: false,
          })
        }
      >
        <Plus /> Add Edge
      </Button>
    );
  }

  if (!!status.addingEdge && !status.edgeAdded) {
    return (
      <div className="w-full flex items-end gap-2">
        {/* Cancel inline selector */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setStatus({ addingEdge: false, edgeAdded: false });
            setValues(createEmptyInputResults([addEdgeInput]));
          }}
        >
          <X />
        </Button>
        {/* Node picker */}
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
        {/* Confirm + open dialog */}
        <Button
          size="icon"
          disabled={!isReadyToAddEdge}
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <Plus />
        </Button>

        {dialogOpen && target && isReadyToAddEdge && (
          <AddEdgeDialog
            open={dialogOpen}
            setOpen={setDialogOpen}
            source={source}
            target={target}
            directed={directed}
            onClose={onClose}
          />
        )}
      </div>
    );
  }

  return null;
}

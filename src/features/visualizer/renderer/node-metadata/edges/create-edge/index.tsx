import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import CreateEdgeDialog from "./create-edge-dialog";
import CreateEdgeSchemaDialog from "./create-edge-schema-dialog";

import type { GraphEdge, GraphNode } from "~/features/visualizer/types";

import { Button } from "~/components/ui/button";
import { useStore } from "~/features/visualizer/hooks/use-store";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResults,
} from "~/features/visualizer/inputs";
import { isNonEmpty } from "~/lib/utils";

export default function CreateEdge({
  source,
  outgoingEdges,
  directed,
  onClose,
}: {
  source: GraphNode;
  outgoingEdges: [GraphNode, GraphEdge][];
  directed: boolean;
  onClose: () => void;
}) {
  const { database } = useStore();

  const createEdgeInput = createAlgorithmSelectInput({
    id: "create-edge-target-node",
    key: "target",
    displayName: "Target Node",
    source: "nodes",
    blacklist: [source, ...outgoingEdges.map((e) => e[0])],
    required: true,
    showLabel: false,
  });

  const [values, setValues] = useState(
    createEmptyInputResults([createEdgeInput])
  );
  const [status, setStatus] = useState({
    selectingEdge: false,
    edgeSelected: false,
  });
  const [dialogStatus, setDialogStatus] = useState({
    createEdge: false,
    createEdgeSchema: false,
  });

  const isReadyToCreateEdge = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  const target = useMemo(() => {
    const id = values[createEdgeInput.key].value;
    return database.graph.nodesMap.get(id) as GraphNode;
  }, [database.graph.nodesMap, values[createEdgeInput.key].value]);

  const onEdgeSelected = () => {
    setStatus((prev) => ({ ...prev, edgeSelected: true }));
    openDialog();
  };

  const openDialog = () => {
    if (!isNonEmpty(database.graph.edgeTables)) {
      setDialogStatus({ createEdge: false, createEdgeSchema: true });
    } else {
      setDialogStatus({ createEdge: true, createEdgeSchema: false });
    }
  };

  const setCreateEdgeOpen = (open: boolean) => {
    setDialogStatus({ createEdge: open, createEdgeSchema: false });
    setStatus({ selectingEdge: true, edgeSelected: false });
  };

  const onSubmitCreateEdgeSchema = () => {
    if (dialogStatus.createEdgeSchema) {
      setDialogStatus({ createEdge: true, createEdgeSchema: false });
    }
  };

  const setCreateEdgeSchemaOpen = (open: boolean) => {
    if (!isNonEmpty(database.graph.edgeTables)) {
      setDialogStatus({ createEdge: false, createEdgeSchema: open });
      setStatus({ selectingEdge: true, edgeSelected: false });
    }
  };

  // User isn't selecting edge or have an edge selected
  if (!status.selectingEdge && !status.edgeSelected) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() =>
          setStatus({
            selectingEdge: true,
            edgeSelected: false,
          })
        }
      >
        <Plus /> Create Edge
      </Button>
    );
  }

  // User is selecting edge
  if (!!status.selectingEdge) {
    return (
      <>
        <div className="w-full flex items-end gap-2">
          {/* Cancel inline selector */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setStatus({ selectingEdge: false, edgeSelected: false });
              setValues(createEmptyInputResults([createEdgeInput]));
            }}
          >
            <X />
          </Button>
          {/* Node picker */}
          <div className="flex-1 min-w-0">
            <InputComponent
              input={createEdgeInput}
              value={values[createEdgeInput.key]?.value}
              onChange={(value) =>
                setValues((prev) => ({
                  ...prev,
                  [createEdgeInput.key]: value,
                }))
              }
            />
          </div>
          {/* Confirm + open dialog */}
          <Button
            size="icon"
            disabled={!isReadyToCreateEdge}
            onClick={onEdgeSelected}
            className="flex items-center gap-1"
          >
            <Plus />
          </Button>
        </div>
        {status.edgeSelected &&
          (!isNonEmpty(database.graph.edgeTables) ? (
            <CreateEdgeSchemaDialog
              source={source}
              target={target}
              directed={directed}
              open={dialogStatus.createEdgeSchema}
              setOpen={setCreateEdgeSchemaOpen}
              onSubmit={onSubmitCreateEdgeSchema}
            />
          ) : (
            <CreateEdgeDialog
              source={source}
              target={target}
              open={dialogStatus.createEdge}
              setOpen={setCreateEdgeOpen}
              onClose={onClose}
            />
          ))}
      </>
    );
  }

  return null;
}

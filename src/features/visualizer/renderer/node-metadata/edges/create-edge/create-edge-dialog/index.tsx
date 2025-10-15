import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Separator } from "@radix-ui/react-separator";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
} from "~/features/visualizer/inputs";
import CreateEdgeDialogForm from "./create-edge-form";
import { useStore } from "~/features/visualizer/hooks/use-store";
import type { GraphNode } from "~/features/visualizer/types";

export default function CreateEdgeDialog({
  source,
  target,
  open,
  setOpen,
}: {
  source: GraphNode;
  target: GraphNode;
  open: boolean;
  setOpen: (b: boolean) => void;
}) {
  const { database } = useStore();
  const { edgeTables, edgeTablesMap } = database.graph;

  const selectEdgeSchemaInput = createAlgorithmSelectInput({
    id: "select-schema",
    key: "selectedEdgeSchema",
    displayName: "Schema:",
    showLabel: false,
    source: "static",
    options: edgeTables.map((n) => n.tableName),
    defaultValue: edgeTables[0].tableName,
  });

  const [selectedEdgeSchema, setSelectedEdgeSchema] = useState(
    createEmptyInputResult(selectEdgeSchemaInput)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Edge</DialogTitle>
          <DialogDescription>
            Choose an edge schema, then provide values for its fields
          </DialogDescription>
        </DialogHeader>
        <InputComponent
          input={selectEdgeSchemaInput}
          value={selectedEdgeSchema.value}
          onChange={setSelectedEdgeSchema}
        />
        <Separator />
        {selectedEdgeSchema.value && (
          <CreateEdgeDialogForm
            key={selectedEdgeSchema.value}
            source={source}
            target={target}
            selectedEdgeSchema={selectedEdgeSchema.value}
            edgeTablesMap={edgeTablesMap}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

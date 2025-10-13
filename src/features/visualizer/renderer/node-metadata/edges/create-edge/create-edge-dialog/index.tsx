import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Separator } from "@radix-ui/react-separator";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
} from "~/features/visualizer/inputs";
import type { EdgeSchema } from "~/features/visualizer/types";
import CreateEdgeDialogForm from "./create-edge-form";
import { useStore } from "~/features/visualizer/hooks/use-store";

export default function CreateEdgeDialog({
  open,
  setOpen,
}: {
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
            selectedEdgeSchema={selectedEdgeSchema.value}
            edgeTablesMap={edgeTablesMap}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

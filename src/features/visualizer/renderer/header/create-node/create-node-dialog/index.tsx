import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
} from "~/features/visualizer/inputs";
import CreateNodeDialogForm from "./create-node-form";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { useStore } from "~/features/visualizer/hooks/use-store";

export default function CreateNodeDialog({
  open,
  onClose,
  onCreateSchemaClick,
}: {
  open: boolean;
  onClose: () => void;
  onCreateSchemaClick: () => void;
}) {
  const { database } = useStore();
  const { nodeTables, nodeTablesMap } = database.graph;

  const selectNodeSchemaInput = createAlgorithmSelectInput({
    id: "select-schema",
    key: "selectedNodeSchema",
    displayName: "Schema:",
    showLabel: false,
    source: "static",
    options: nodeTables.map((n) => n.tableName),
    defaultValue: nodeTables[0].tableName,
  });

  const [selectedNodeSchema, setSelectedNodeSchema] = useState(
    createEmptyInputResult(selectNodeSchemaInput)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Node</DialogTitle>
          <DialogDescription>
            Choose a node schema, then provide values for its fields
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <InputComponent
              input={selectNodeSchemaInput}
              value={selectedNodeSchema.value}
              onChange={setSelectedNodeSchema}
            />
          </div>
          <Button variant="outline" onClick={() => onCreateSchemaClick()}>
            Create Schema
          </Button>
        </div>
        <Separator />
        {selectedNodeSchema.value && (
          <CreateNodeDialogForm
            key={selectedNodeSchema.value}
            selectedNodeSchema={selectedNodeSchema.value}
            nodeTablesMap={nodeTablesMap}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

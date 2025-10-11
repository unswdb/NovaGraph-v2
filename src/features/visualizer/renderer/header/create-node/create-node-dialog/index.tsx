import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { NonEmptyNodeSchemas } from "..";
import type { NodeSchema } from "~/features/visualizer/types";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
} from "~/features/visualizer/inputs";
import CreateNodeDialogForm from "./create-node-form";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";

export default function CreateNodeDialog({
  open,
  onClose,
  onCreateSchemaClick,
  nodeSchemas,
  nodeSchemasMap,
}: {
  open: boolean;
  onClose: () => void;
  onCreateSchemaClick: () => void;
  nodeSchemas: NonEmptyNodeSchemas;
  nodeSchemasMap: Record<string, NodeSchema>;
}) {
  const selectNodeSchemaInput = createAlgorithmSelectInput({
    id: "select-schema",
    key: "selectedNodeSchema",
    displayName: "Schema:",
    showLabel: false,
    source: "static",
    options: nodeSchemas.map((n) => n.tableName),
    defaultValue: nodeSchemas[0].tableName,
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
            Choose a node type, then provide values for its fields
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
            nodeSchemasMap={nodeSchemasMap}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

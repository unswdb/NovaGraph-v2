import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Separator } from "@radix-ui/react-separator";
import { useState } from "react";

import CreateEdgeDialogForm from "./create-edge-form";

import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
} from "~/features/visualizer/inputs";
import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
import type { NonEmpty } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export default function CreateEdgeDialog({
  source,
  target,
  schemas,
  directed,
  open,
  setOpen,
  onClose,
  onCreateSchemaClick,
}: {
  source: GraphNode;
  target: GraphNode;
  schemas: NonEmpty<EdgeSchema>;
  directed: boolean;
  open: boolean;
  setOpen: (b: boolean) => void;
  onClose: () => void;
  onCreateSchemaClick: () => void;
}) {
  const selectEdgeSchemaInput = createAlgorithmSelectInput({
    id: "select-schema",
    key: "selectedEdgeSchema",
    displayName: "Schema:",
    showLabel: false,
    source: "static",
    options: schemas.map((s) => s.tableName),
    required: true,
    defaultValue: schemas[0].tableName,
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
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <InputComponent
              input={selectEdgeSchemaInput}
              value={selectedEdgeSchema.value}
              onChange={setSelectedEdgeSchema}
            />
          </div>
          <Button variant="outline" onClick={() => onCreateSchemaClick()}>
            Create Schema
          </Button>
        </div>
        <Separator />
        {selectedEdgeSchema.value && (
          <CreateEdgeDialogForm
            key={selectedEdgeSchema.value}
            source={source}
            target={target}
            directed={directed}
            selectedEdgeSchema={selectedEdgeSchema.value}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

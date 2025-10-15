import { useMemo, useState } from "react";

import CreateNodeDialogForm from "./create-node-form";

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
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import type { GraphNode, NodeSchema } from "~/features/visualizer/types";

export default function CreateNodeDialog({
  open,
  onClose,
  nodes,
  nodeTables,
  nodeTablesMap,
  onCreateSchemaClick,
}: {
  open: boolean;
  onClose: () => void;
  nodes: GraphNode[];
  nodeTables: NodeSchema[];
  nodeTablesMap: Map<string, NodeSchema>;
  onCreateSchemaClick: () => void;
}) {
  const selectNodeSchemaInput = createAlgorithmSelectInput({
    id: "select-table-name",
    key: "selectedTableName",
    displayName: "Schema:",
    showLabel: false,
    source: "static",
    options: nodeTables.map((n) => n.tableName),
    defaultValue: nodeTables[0].tableName,
  });

  const [selectedTableName, setSelectedNodeSchema] = useState(
    createEmptyInputResult(selectNodeSchemaInput)
  );

  const selectedNodeSchema = useMemo(
    () =>
      !!selectedTableName.value
        ? nodeTablesMap.get(selectedTableName.value) ?? null
        : null,
    [selectedTableName.value]
  );

  const nodesWithinSameTable = useMemo(
    () =>
      !!selectedTableName.value && !!selectedNodeSchema
        ? nodes.filter((t) => t.tableName === selectedTableName.value)
        : [],
    [nodes, selectedTableName.value, selectedNodeSchema]
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
              value={selectedTableName.value}
              onChange={setSelectedNodeSchema}
            />
          </div>
          <Button variant="outline" onClick={() => onCreateSchemaClick()}>
            Create Schema
          </Button>
        </div>
        <Separator />
        {selectedNodeSchema && (
          <CreateNodeDialogForm
            key={selectedNodeSchema.tableName}
            selectedNodeSchema={selectedNodeSchema}
            nodesWithinSameTable={nodesWithinSameTable}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

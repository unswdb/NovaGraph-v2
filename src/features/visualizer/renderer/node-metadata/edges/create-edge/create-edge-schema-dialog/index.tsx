import CreateEdgeSchemaForm from "./create-edge-schema-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { GraphNode } from "~/features/visualizer/types";

export default function CreateEdgeSchemaDialog({
  source,
  target,
  directed,
  open,
  setOpen,
  onSubmit,
}: {
  source: GraphNode;
  target: GraphNode;
  directed: boolean;
  open: boolean;
  setOpen: (b: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create A New Edge Schema For {source.tableName}{" "}
            {directed ? "→" : "↔"} {target.tableName}
          </DialogTitle>
          <DialogDescription>
            Define your edge structure and properties to start creating edges
            between {source.tableName} and {target.tableName}. If you plan to
            use algorithms that rely on weights (e.g., shortest paths,
            centrality), please add a <b>weight</b> attribute with any numeric
            type (INT, UINT, FLOAT, DOUBLE)
          </DialogDescription>
        </DialogHeader>
        <CreateEdgeSchemaForm
          source={source}
          target={target}
          directed={directed}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

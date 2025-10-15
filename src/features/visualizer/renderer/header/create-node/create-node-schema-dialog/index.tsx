import CreateNodeSchemaForm from "./create-node-schema-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { NodeSchema } from "~/features/visualizer/types";

export default function CreateNodeSchemaDialog({
  open,
  setOpen,
  nodeTables,
  onSubmit,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  nodeTables: NodeSchema[];
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create A New Node Schema</DialogTitle>
          <DialogDescription>
            Define your node structure and properties to start creating nodes.
          </DialogDescription>
        </DialogHeader>
        <CreateNodeSchemaForm nodeTables={nodeTables} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

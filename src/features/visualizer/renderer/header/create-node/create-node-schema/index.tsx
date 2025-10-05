import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import CreateNodeSchemaForm from "./create-node-schema-form";
import type { GraphSchema } from "~/features/visualizer/types";

export default function CreateNodeSchemaDialog({
  open,
  setOpen,
  nodeSchemas,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  nodeSchemas: GraphSchema[];
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
        <CreateNodeSchemaForm nodeSchemas={nodeSchemas} />
      </DialogContent>
    </Dialog>
  );
}

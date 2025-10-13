import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import CreateNodeSchemaForm from "./create-node-schema-form";

export default function CreateNodeSchemaDialog({
  open,
  setOpen,
  onSubmit,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
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
        <CreateNodeSchemaForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

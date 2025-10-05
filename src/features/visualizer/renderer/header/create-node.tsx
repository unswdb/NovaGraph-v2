import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { createEmptyInputResults } from "../../inputs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export default function CreateNode() {
  const inputs = [
    // TODO: Make inputs based on schema
  ].flat();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(createEmptyInputResults(inputs));

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    toast.success("Node created (not really, yet!)");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Node
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Node</DialogTitle>
          <DialogDescription>
            Create a new node under the database schema. Once created, the node
            can be connected to others through edges to represent relationships
            within the graph.
          </DialogDescription>
        </DialogHeader>
        {/* TODO: Inputs for create node */}
        <div className="ml-auto">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isReadyToSubmit}
            className="flex-1"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

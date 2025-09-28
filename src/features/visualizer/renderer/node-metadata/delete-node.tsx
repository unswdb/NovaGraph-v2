import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { toast } from "sonner";
import type { GraphNode } from "../../types";
import { Button } from "~/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteNodeButton({ node }: { node: GraphNode }) {
  // TODO: Implement handleDelete
  const handleDelete = (node: GraphNode) => {
    toast.success("Node deleted (not really, yet!)");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="critical" className="w-full font-bold">
          <Trash2 className="size-4" /> Delete Node
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this node?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the node and all of its connected edges
            from the graph. The action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete(node)}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

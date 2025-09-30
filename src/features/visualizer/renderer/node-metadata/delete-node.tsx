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
import { useStore } from "../../hooks/use-store";

export default function DeleteNodeButton({
  node,
  onClose,
}: {
  node: GraphNode;
  onClose: () => void;
}) {
  const store = useStore();

  const handleDelete = async (node: GraphNode) => {
    await store.controller.db.deleteNode(node);
    const result = await store.controller.db.snapshotGraphState();
    store.setNodes(result.nodes);
    store.setEdges(result.edges);
    toast.success("Node deleted");
    onClose();
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

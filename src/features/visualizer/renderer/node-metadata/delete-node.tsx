import { toast } from "sonner";
import { Loader, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";

import type { GraphNode } from "../../types";
import { useStore } from "../../hooks/use-store";

import { Button } from "~/components/ui/button";
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
import { useAsyncFn } from "~/hooks/use-async-fn";

const DeleteNodeButton = observer(
  ({ node, onClose }: { node: GraphNode; onClose: () => void }) => {
    const { controller, setGraphState } = useStore();

    const { run: deleteNode, isLoading } = useAsyncFn(
      controller.db.deleteNode.bind(controller.db),
      {
        onSuccess: (result) => {
          setGraphState({
            nodes: result.nodes,
            edges: result.edges,
            nodeTables: result.nodeTables,
            edgeTables: result.edgeTables,
            directed: (result as any).directed ?? database.graph.directed,
          });
          toast.success("Node deleted successfully!");
          onClose();
        },
      }
    );

    const handleDelete = async (node: GraphNode) => {
      await deleteNode(node);
    };

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="critical"
            className="w-full font-bold"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="animate-spin" />
            ) : (
              <>
                <Trash2 className="size-4" /> Delete Node
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete node "{String(node._primaryKeyValue)}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the node and all of its connected
              edges from the graph. The action cannot be undone.
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
);

export default DeleteNodeButton;

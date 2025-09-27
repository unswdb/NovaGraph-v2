import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { GraphNode } from "~/features/visualizer/types";

export default function AddEdgeDialog({
  source,
  target,
  directed,
  trigger,
}: {
  source: GraphNode;
  target: GraphNode;
  directed: boolean;
  trigger: ReactNode;
}) {
  console.log(source, target, directed, trigger);

  // TODO: Implement handleAddEdge
  const handleAddEdge = (
    source: GraphNode,
    target: GraphNode,
    directed: boolean
  ) => {
    toast.success("Edge added (not really, yet!)");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogHeader>
        <DialogTitle>
          Add Edge{" "}
          <b>
            {source.label ?? source.id} {directed ? "→" : "↔"}{" "}
            {target.label ?? target.id}
          </b>
        </DialogTitle>
      </DialogHeader>
    </Dialog>
  );
}

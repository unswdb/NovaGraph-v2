import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { GraphNode } from "../../types";
import { Button } from "~/components/ui/button";
import { ChevronDown, ChevronRight, Trash2, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import AttributesForm from "./attributes";
import { toast } from "sonner";
import EdgesList from "./edges";

export default function NodeMetadata({
  node,
  outgoingEdges,
  onClose,
  className,
}: {
  node: GraphNode;
  outgoingEdges: GraphNode[];
  onClose: () => void;
  className?: string;
}) {
  const [isAttributeExpanded, setIsAttributeExpanded] = useState(false);
  const [isEdgesExpanded, setIsEdgesExpanded] = useState(false);

  // TODO: Implement handleDelete
  const handleDelete = (node: GraphNode) => {
    toast.success("Node deleted (not really, yet!)");
  };

  console.log("outgoingEdges", outgoingEdges);

  return (
    <Card
      className={cn(
        "absolute bottom-14 right-14 w-74 max-h-2/3 z-50 flex flex-col",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="truncate">Node {node.label ?? node.id}</CardTitle>
        <CardDescription className="truncate">
          View and edit details to a node
        </CardDescription>
        <CardAction>
          <Button variant="ghost" onClick={onClose} size="sm">
            <X />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col overflow-y-auto gap-2 px-3">
        {/* Node attributes */}
        <Collapsible
          open={isAttributeExpanded}
          onOpenChange={setIsAttributeExpanded}
        >
          <CollapsibleTrigger className="py-1 px-2 w-full flex items-center justify-between rounded-md duration-150 hover:bg-neutral-low">
            Attributes
            <span className="ml-auto text-muted-foreground">
              {isAttributeExpanded ? <ChevronDown /> : <ChevronRight />}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="py-1 px-2 space-y-4 flex flex-col mt-4">
            <AttributesForm node={node} />
          </CollapsibleContent>
        </Collapsible>
        {/* Node edges */}
        <Collapsible open={isEdgesExpanded} onOpenChange={setIsEdgesExpanded}>
          <CollapsibleTrigger className="py-1 px-2 w-full flex items-center justify-between rounded-md duration-150 hover:bg-neutral-low">
            Edges
            <span className="ml-auto text-muted-foreground">
              {isEdgesExpanded ? <ChevronDown /> : <ChevronRight />}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="py-1 px-2 space-y-4 flex flex-col mt-4">
            <EdgesList node={node} outgoingEdges={outgoingEdges} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
}

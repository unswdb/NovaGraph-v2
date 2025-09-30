import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { GraphEdge, GraphNode } from "../../types";
import { Button } from "~/components/ui/button";
import { ChevronDown, ChevronRight, Trash2, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import AttributesForm from "./attributes";
import EdgesList from "./edges";
import DeleteNodeButton from "./delete-node";

export default function NodeMetadata({
  node,
  nodesMap,
  outgoingEdges,
  directed,
  onClose,
  className,
}: {
  node: GraphNode;
  nodesMap: Record<string, GraphNode>;
  outgoingEdges: [GraphNode, GraphEdge][];
  directed: boolean;
  onClose: () => void;
  className?: string;
}) {
  const [isAttributeExpanded, setIsAttributeExpanded] = useState(false);
  const [isEdgesExpanded, setIsEdgesExpanded] = useState(false);

  return (
    <Card
      className={cn(
        "absolute bottom-14 right-14 w-74 max-h-3/5 z-50 flex flex-col",
        className
      )}
    >
      <CardHeader className="px-4">
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
            <EdgesList
              node={node}
              nodesMap={nodesMap}
              outgoingEdges={outgoingEdges}
              directed={directed}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter>
        <DeleteNodeButton node={node} onClose={onClose} />
      </CardFooter>
    </Card>
  );
}

import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import AttributesForm from "./attributes";
import DeleteNodeButton from "./delete-node";
import EdgesList from "./edges";

import type { GraphEdge, GraphNode, NodeSchema } from "../../types";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";

export default function NodeMetadata({
  node,
  nodeSchema,
  outgoingEdges,
  directed,
  onClose,
  className,
}: {
  node: GraphNode;
  nodeSchema: NodeSchema;
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
        <CardTitle className="truncate">Node {node._primaryKeyValue}</CardTitle>
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
            <AttributesForm node={node} nodeSchema={nodeSchema} />
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
              outgoingEdges={outgoingEdges}
              directed={directed}
              onClose={onClose}
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

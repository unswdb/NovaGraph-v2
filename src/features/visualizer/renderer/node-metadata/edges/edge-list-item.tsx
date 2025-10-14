import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { EdgeSchema, GraphEdge, GraphNode } from "../../../types";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import InputComponent, {
  createEmptyInputResults,
} from "~/features/visualizer/inputs";
import { capitalize } from "~/lib/utils";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { createSchemaInput } from "~/features/visualizer/schema-inputs";
import { useStore } from "~/features/visualizer/hooks/use-store";

export default function EdgeListItem({
  source,
  target,
  edge,
  edgeSchema,
  directed,
}: {
  source: GraphNode;
  target: GraphNode;
  edge: GraphEdge;
  edgeSchema: EdgeSchema;
  directed: boolean;
}) {
  const inputs = [
    Object.entries(edgeSchema.properties).map(([key, type]) =>
      createSchemaInput(type, {
        id: `edge-${key}`,
        key,
        displayName: capitalize(key),
        placeholder: `Enter ${key}...`,
        defaultValue: edge.attributes?.[key] ?? undefined,
        required: false,
      })
    ),
  ].flat();

  const [values, setValues] = useState(createEmptyInputResults(inputs));

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleDeleteEdge
  const store = useStore();
  const handleDeleteEdge = async (node1: GraphNode, node2: GraphNode) => {
    let result = await store.controller.db.deleteEdge(node1, node2, edgeSchema.tableName);
    if (
      !!result.nodes &&
      !!result.edges &&
      !!result.nodeTables &&
      !!result.edgeTables
    ) {
      store.setGraphState({
        nodes: result.nodes,
        edges: result.edges,
        nodeTables: result.nodeTables,
        edgeTables: result.edgeTables,
      });
    }
    toast.success("Edge deleted (not really, yet!)");
  };

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    toast.success("Edge attributes updated (not really, yet!)");
  };

  return (
    <div className="w-full flex items-center rounded-md group duration-150 hover:bg-neutral-low">
      {/* Edges Attribute */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="pl-2 flex-1 justify-between hover:bg-transparent"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate">
                  {target._primaryKeyValue} ({edge.weight}){" "}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Label: {target._primaryKeyValue} • Weight: {edge.weight}
              </TooltipContent>
            </Tooltip>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edge{" "}
              <b>
                {source._primaryKeyValue} {directed ? "→" : "↔"}{" "}
                {target._primaryKeyValue}
              </b>
            </DialogTitle>
            <DialogDescription>
              Edit the properties of the selected edge between the two nodes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 flex-1">
            {inputs.map((input, index) => (
              <InputComponent
                key={index}
                input={input}
                value={values[input.key].value}
                onChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    [input.key]: value,
                  }))
                }
              />
            ))}
          </div>
          <div className="ml-auto">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!isReadyToSubmit}
              className="flex-1"
            >
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete edge */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost">
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this edge?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the edge between the two nodes. The
              nodes themselves will remain in the graph. The action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteEdge(source, target)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

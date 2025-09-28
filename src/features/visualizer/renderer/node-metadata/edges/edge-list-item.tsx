import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { GraphEdge, GraphNode } from "../../../types";
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
  createNumberInput,
  createTextInput,
} from "~/features/visualizer/inputs";
import { capitalize } from "~/lib/utils";
import { useMemo, useState } from "react";

export default function EdgeListItem({
  source,
  target,
  edge,
  directed,
}: {
  source: GraphNode;
  target: GraphNode;
  edge: GraphEdge;
  directed: boolean;
}) {
  const inputs = [
    createNumberInput({
      id: "edge-weight",
      label: "Weight",
      placeholder: "Enter weight...",
      defaultValue: edge.weight ?? 0,
      min: 0,
      step: 1,
    }),
    edge.attributes
      ? Object.entries(edge.attributes).map(([key, value]) =>
          createTextInput({
            id: `edge-${key}`,
            label: capitalize(key),
            placeholder: `Node ${capitalize(key)}`,
            defaultValue: String(value),
            required: false,
          })
        )
      : [],
  ].flat();

  const [values, setValues] = useState(createEmptyInputResults(inputs));

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleDeleteEdge
  const handleDeleteEdge = (node1: GraphNode, node2: GraphNode) => {
    toast.success("Edge deleted (not really, yet!)");
  };

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    toast.success("Attributes updated (not really, yet!)");
  };

  return (
    <div className="w-full flex items-center rounded-md group duration-150 hover:bg-neutral-low">
      {/* Edges Attribute */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            key={target.id}
            className="pl-2 flex-1 justify-between hover:bg-transparent"
          >
            {target.label ? (
              <span className="truncate">
                {target.label}{" "}
                <span className="text-typography-tertiary">
                  (ID: {target.id})
                </span>
              </span>
            ) : (
              <span className="truncate">{target.id}</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edge{" "}
              <b>
                {source.label ?? source.id} {directed ? "→" : "↔"}{" "}
                {target.label ?? target.id}
              </b>
            </DialogTitle>
            <DialogDescription>
              Edit the properties of the selected edge between the two nodes.
            </DialogDescription>
          </DialogHeader>
          {inputs.map((input, index) => (
            <InputComponent
              key={index}
              input={input}
              value={values[input.label].value}
              onChange={(value) =>
                setValues((prev) => ({
                  ...prev,
                  [input.label]: value,
                }))
              }
            />
          ))}
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

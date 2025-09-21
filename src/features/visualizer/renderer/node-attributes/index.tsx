import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { GraphNode } from "../../types";
import { Button } from "~/components/ui/button";
import { Trash2, X } from "lucide-react";
import { capitalize, cn } from "~/lib/utils";
import InputComponent, {
  createEmptyInputResults,
  createTextInput,
  type InputChangeResult,
} from "../../inputs";
import { useMemo, useState } from "react";
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

export default function NodeAttributesForm({
  node,
  onClose,
  className,
}: {
  node: GraphNode;
  onClose: () => void;
  className?: string;
}) {
  const inputs = [
    createTextInput({
      id: "node-id",
      label: "ID",
      disabled: true,
      placeholder: "Node ID",
      defaultValue: node.id,
      required: true,
    }),
    node.label
      ? createTextInput({
          id: "node-label",
          label: "Label",
          placeholder: "Node Label",
          defaultValue: node.label,
          required: false,
          validator: async (value) => {
            const isValid = value.trim().length > 0;
            return {
              success: isValid,
              message: isValid ? "" : "Label cannot be empty",
            };
          },
        })
      : [],
    node.attributes
      ? Object.entries(node.attributes).map(([key, value]) =>
          createTextInput({
            id: `node-${key}`,
            label: capitalize(key),
            placeholder: `Node ${capitalize(key)}`,
            defaultValue: String(value),
            required: false,
          })
        )
      : [],
  ].flat();

  const [values, setValues] = useState<Record<string, InputChangeResult>>(
    createEmptyInputResults(inputs)
  );

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    console.log("Submitted values:", values);
  };

  // TODO: Implement handleDelete
  const handleDelete = (node: GraphNode) => {};

  return (
    <Card
      className={cn(
        "absolute bottom-14 right-14 w-72 max-h-1/2 z-50 flex flex-col",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="truncate">Node {node.label}</CardTitle>
        <CardDescription className="truncate">
          View and edit details to a node
        </CardDescription>
        <CardAction>
          <Button variant="ghost" onClick={onClose} size="sm">
            <X />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col overflow-y-auto">
        <div className="space-y-4 flex-1">
          {inputs.map((input) => (
            <InputComponent
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
        </div>
        <div className="flex items-center self-end gap-2">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isReadyToSubmit}
          >
            Update
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="critical">
                <Trash2 />
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
        </div>
      </CardContent>
    </Card>
  );
}

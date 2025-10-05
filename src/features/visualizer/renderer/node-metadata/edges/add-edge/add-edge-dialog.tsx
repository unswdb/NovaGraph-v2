import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog";
import InputComponent, {
  createEmptyInputResults,
  createNumberInput,
} from "~/features/visualizer/inputs";
import type { GraphNode } from "~/features/visualizer/types";

export default function AddEdgeDialog({
  open,
  setOpen,
  source,
  target,
  directed,
  onClose,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  source: GraphNode;
  target: GraphNode;
  directed: boolean;
  onClose: () => void;
}) {
  const inputs = [
    createNumberInput({
      id: "edge-weight",
      key: "weight",
      displayName: "Weight",
      placeholder: "Enter weight...",
      defaultValue: 0,
      min: 0,
      step: 1,
    }),
    // TODO: Make inputs based on schema
  ].flat();

  const [values, setValues] = useState(createEmptyInputResults(inputs));

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    toast.success("Edge added (not really, yet!)");
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add Edge{" "}
            <b>
              {source._primaryKeyValue} {directed ? "→" : "↔"}{" "}
              {target._primaryKeyValue}
            </b>
          </DialogTitle>
          <DialogDescription>
            Specify these attributes to define how this edge behaves in the
            graph.
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
  );
}

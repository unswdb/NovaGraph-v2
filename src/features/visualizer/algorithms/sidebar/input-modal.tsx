import { cloneElement, useMemo, useState } from "react";
import type { GraphEdge, GraphModule, GraphNode } from "../../types";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "../implementations";
import { SidebarMenuButton } from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import AlgorithmInput from "./algorithm-input";

export default function AlgorithmInputModal({
  module,
  algorithm,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
  separator = false,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  module: GraphModule | null;
  algorithm: BaseGraphAlgorithm;
  nodes: GraphNode[];
  edges: GraphEdge[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult) => void;
  separator?: boolean;
}) {
  // States
  const [open, setOpen] = useState(false);
  const [inputValues, setInputValues] = useState<
    Record<string, string | number>
  >({}); // Track all input values

  // Memoised values
  const isReadyToSubmit = useMemo(
    () =>
      Object.entries(inputValues).length === algorithm.inputs.length &&
      Object.values(inputValues).every((v) => !!v),
    [inputValues, algorithm]
  );

  // TODO: Handle error and loading state
  const handleSubmit = async () => {
    try {
      const args = algorithm.inputs.map((input) => inputValues[input.label]);
      const algorithmResponse = algorithm.wasmFunction(module, args);
      setActiveAlgorithm(algorithm);
      setActiveResponse(algorithmResponse);
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const menuButton = (
    <SidebarMenuButton
      className={cn("p-0 hover:[&>span]:bg-neutral-low", className)}
      {...props}
    >
      {separator && <Separator className="ml-4 mr-2" orientation="vertical" />}
      <span className="flex items-center px-3 rounded-md h-full w-full text-ellipsis">
        {algorithm.title}
      </span>
    </SidebarMenuButton>
  );

  // Return just the button if we don't need inputs from users
  if (algorithm.inputs.length <= 0) {
    return cloneElement(menuButton, {
      onClick: handleSubmit,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{menuButton}</DialogTrigger>
      <DialogContent>
        {/* Title + Description */}
        <DialogHeader>
          <DialogTitle>{algorithm.title}</DialogTitle>
          <DialogDescription>{algorithm.description}</DialogDescription>
        </DialogHeader>
        {/* Inputs */}
        <div className="space-y-6 mt-2">
          {algorithm.inputs.map((input, index) => (
            <AlgorithmInput
              key={input.label}
              input={input}
              nodes={nodes}
              edges={edges}
              value={inputValues[input.label]}
              onChange={(value) =>
                setInputValues((prev) => ({
                  ...prev,
                  [input.label]: value,
                }))
              }
            />
          ))}
        </div>
        {/* Submit button */}
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isReadyToSubmit}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

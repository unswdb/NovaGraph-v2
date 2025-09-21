import { cloneElement, useEffect, useMemo, useState } from "react";
import type { GraphEdge, GraphModule, GraphNode } from "../types";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "./implementations";
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
import InputComponent, {
  createEmptyInputResults,
  type InputChangeResult,
} from "../inputs";
import { toast } from "sonner";
import { useLoading } from "~/components/ui/loading";

// Worker singleton
let AlgorithmWorker: Worker | null = null;

export default function InputDialog({
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
  // Hooks
  const { startLoading, stopLoading } = useLoading();

  // States
  const [open, setOpen] = useState(false);
  const [inputResults, setInputResults] = useState<
    Record<string, InputChangeResult>
  >(createEmptyInputResults(algorithm.inputs));

  useEffect(() => {
    // Initialise worker if it doesn't exist
    if (!AlgorithmWorker) {
      AlgorithmWorker = new Worker(
        new URL("algorithm-worker.ts", import.meta.url),
        { type: "module" }
      );
    }

    // Cleanup the worker on component unmount
    return () => {
      if (AlgorithmWorker) {
        AlgorithmWorker.terminate();
        AlgorithmWorker = null;
      }
    };
  }, []);

  // Memoised values
  const isReadyToSubmit = useMemo(
    () => Object.values(inputResults).every((v) => v.success),
    [inputResults, algorithm]
  );

  const handleSubmit = async () => {
    if (!module || !AlgorithmWorker) return;

    setOpen(false);
    startLoading("Running Algorithm...");

    setTimeout(() => {
      try {
        const args = algorithm.inputs.map(
          (input) => inputResults[input.label].value
        );

        const algorithmResponse = algorithm.wasmFunction(module, args);
        setActiveAlgorithm(algorithm);
        setActiveResponse(algorithmResponse);
      } catch (err) {
        toast.error(
          module && typeof err == "number"
            ? module.what_to_stderr(err)
            : String(err) ??
                "An unexpected error occurred. Please try again later."
        );
      } finally {
        stopLoading();
      }
    }, 0);
  };

  const menuButton = (
    <SidebarMenuButton
      className={cn("p-0 hover:[&>span]:bg-neutral-low", className)}
      {...props}
    >
      {separator && <Separator className="ml-4 mr-2" orientation="vertical" />}
      <span className="flex items-center px-3 rounded-md h-full w-full truncate">
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
      {/* Title + Description */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{algorithm.title}</DialogTitle>
          <DialogDescription>{algorithm.description}</DialogDescription>
        </DialogHeader>
        {/* Inputs */}
        <div className="space-y-6 mt-2">
          {algorithm.inputs.map((input, index) => (
            <InputComponent
              key={index}
              input={input}
              value={inputResults[input.label]?.value}
              onChange={(value) =>
                setInputResults((prev) => ({
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

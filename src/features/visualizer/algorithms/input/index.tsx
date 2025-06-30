import { SidebarMenuButton } from "~/components/ui/sidebar";
import type {
  BaseGraphAlgorithm,
  GraphAlgorithmInput,
  SelectInput,
} from "../implementations";
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
import { Label } from "~/components/form/label";
import type React from "react";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "~/components/form/select";
import type { GraphEdge, GraphNode } from "../../types";
import { Input } from "~/components/form/input";
import { SelectValue } from "@radix-ui/react-select";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export default function AlgorithmInputModal({
  algorithm,
  nodes,
  edges,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  algorithm: BaseGraphAlgorithm;
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const [open, setOpen] = useState(false);

  // TODO: Run WASM function to get response if we
  // don't need user inputs and clicked
  const menuButton = (
    <SidebarMenuButton
      className={cn("p-0 hover:[&>span]:bg-neutral-low", className)}
      {...props}
    >
      <Separator className="ml-4 mr-2" orientation="vertical" />
      <span className="flex items-center px-3 rounded-md h-full w-full text-ellipsis">
        {algorithm.title}
      </span>
    </SidebarMenuButton>
  );

  // Return just the button if we don't need inputs from users
  if (algorithm.inputs.length <= 0) {
    return menuButton;
  }

  // TODO: Run WASM function to get response
  const handleSubmit = () => {
    setOpen(false);
  };

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
              key={index}
              input={input}
              nodes={nodes}
              edges={edges}
            />
          ))}
        </div>
        {/* Submit button */}
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlgorithmInput({
  input,
  nodes,
  edges,
}: {
  input: GraphAlgorithmInput;
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  switch (input.type) {
    case "select":
      return (
        <div className="space-y-4">
          <Label>{input.label}</Label>
          <AlgorithmSelectInput input={input} nodes={nodes} edges={edges} />
        </div>
      );
    case "number":
      return (
        <div className="space-y-1">
          <Label>{input.label}</Label>
          <Input type="number" min={input.min ?? 0} max={input.max} />
        </div>
      );
  }
}

function AlgorithmSelectInput({
  input,
  nodes,
  edges,
}: {
  input: SelectInput;
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const source = input.source;
  const placeholder =
    source === "static"
      ? "Select an option..."
      : source === "edges"
      ? "Select an edge..."
      : "Select a node...";
  const sources =
    source === "static"
      ? (input.options ?? []).map((opt) => ({ value: opt, label: opt }))
      : source === "edges"
      ? edges.map((e) => ({
          value: `${e.source}-${e.target}`,
          label: `${e.source} → ${e.target}`,
        }))
      : nodes.map((n) => ({
          value: `${n.id}`,
          label: n.name ?? `Node ${n.id}`,
        }));

  return (
    <Select>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {sources.map((source) => (
            <SelectItem key={source.value} value={source.value}>
              {source.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

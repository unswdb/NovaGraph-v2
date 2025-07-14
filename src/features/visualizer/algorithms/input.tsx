import { SidebarMenuButton } from "~/components/ui/sidebar";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
  GraphAlgorithmInput,
  SelectInput,
} from "./implementations";
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
import React from "react";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "~/components/form/select";
import type { GraphEdge, GraphModule, GraphNode } from "../types";
import { Input } from "~/components/form/input";
import { SelectValue } from "@radix-ui/react-select";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";

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
    return React.cloneElement(menuButton, {
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
              key={index}
              input={input}
              nodes={nodes}
              edges={edges}
              value={inputValues[input.label]}
              onChange={(value) =>
                setInputValues((prev) => ({ ...prev, [input.label]: value }))
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

function AlgorithmInput({
  input,
  nodes,
  edges,
  value,
  onChange,
}: {
  input: GraphAlgorithmInput;
  nodes: GraphNode[];
  edges: GraphEdge[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
}) {
  switch (input.type) {
    case "select":
      return (
        <div className="space-y-4">
          <Label>{input.label}</Label>
          <AlgorithmSelectInput
            input={input}
            nodes={nodes}
            edges={edges}
            value={value ? String(value) : ""}
            onChange={onChange}
          />
        </div>
      );
    case "number":
      return (
        <div className="space-y-1">
          <Label>{input.label}</Label>
          <Input
            type="number"
            min={input.min ?? 0}
            max={input.max}
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      );
  }
}

function AlgorithmSelectInput({
  input,
  nodes,
  edges,
  value,
  onChange,
}: {
  input: SelectInput;
  nodes: GraphNode[];
  edges: GraphEdge[];
  value: string;
  onChange: (value: string) => void;
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
          value: n.id,
          label: n.name ?? `Node ${n.id}`,
        }));

  return (
    <Select value={value} onValueChange={onChange}>
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

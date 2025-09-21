import type { AlgorithmSelectInput } from "./types";
import { useStore } from "~/features/visualizer/hooks/use-store";
import type { InputComponentProps } from "../../types";
import { useEffect, useState } from "react";
import type { GraphEdge, GraphNode } from "~/features/visualizer/types";
import useAlgorithmSelectInputValue from "./use-algorithm-select-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";

export default function AlgorithmSelectInputComponent({
  input,
  value: inputValue,
  onChange,
}: InputComponentProps<AlgorithmSelectInput>) {
  // Hooks
  const store = useStore();

  // States
  const source = input.source;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useAlgorithmSelectInputValue(input);

  const onValueChange = (value: GraphNode | GraphEdge | string | undefined) => {
    setValue(value);
    if (!input.required || (!!value && input.required)) {
      onChange({ value, success: true });
    } else {
      onChange({ value, success: false });
    }
  };

  // Set value to default inputValue
  useEffect(() => {
    onValueChange(inputValue as GraphNode | GraphEdge | string | undefined);
  }, [inputValue]);

  const targetItemType =
    source === "static" ? "option" : source === "edges" ? "edge" : "node";

  const placeholder =
    source === "static"
      ? "Select an option..."
      : source === "edges"
      ? "Select an edge..."
      : "Select a node...";

  const sources =
    source === "static"
      ? (input.options ?? [])
          .filter((opt) => !(input.blacklist ?? []).includes(opt))
          .map((opt) => ({ value: opt, label: opt }))
      : source === "edges"
      ? store.database?.graph.edges
          .filter((edge) => !(input.blacklist ?? []).includes(edge))
          .map((e) => ({
            value: `${e.source}-${e.target}`,
            label: `${e.source} → ${e.target}`,
          })) ?? []
      : store.database?.graph.nodes
          .filter((node) => !(input.blacklist ?? []).includes(node))
          .map((n) => ({
            value: n.id,
            label: n.label ?? `Node ${n.id}`,
          })) ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? sources.find((source) => source.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList className="overflow-y-auto">
            <CommandEmpty>No {targetItemType} found.</CommandEmpty>
            <CommandGroup>
              {sources.map((source) => (
                <CommandItem
                  key={source.value}
                  value={source.label}
                  onSelect={() => {
                    onValueChange(source.value);
                    setOpen(false);
                  }}
                >
                  {source.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === source.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

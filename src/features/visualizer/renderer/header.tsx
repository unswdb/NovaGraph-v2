import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/form/select";
import type { GraphDatabase, GraphEdge, GraphNode } from "../types";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Button } from "~/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import type { CosmographRef } from "@cosmograph/react";
import { useZoomControls } from "./hooks/use-zoom-controls";
import { capitalize, cn } from "~/lib/utils";
import ImportDropdown from "../import/import-dropdown";

type Accessor = { label: string; accessor: (n: GraphNode) => string };

export default function GraphRendererHeader({
  database,
  databases,
  setDatabase,
  addDatabase,
  cosmographRef,
  nodes,
}: {
  database: GraphDatabase | null;
  databases: GraphDatabase[];
  setDatabase: (g: GraphDatabase) => void;
  addDatabase: (g: GraphDatabase) => void;
  cosmographRef: RefObject<CosmographRef<GraphNode, GraphEdge> | null>;
  nodes: GraphNode[];
}) {
  // Hooks
  const { zoomToNode } = useZoomControls(cosmographRef);

  const accessors: Accessor[] =
    nodes.length > 0
      ? [
          { label: "ID", accessor: (n: GraphNode) => String(n.id) },
          ...(nodes[0]?.label
            ? [{ label: "Label", accessor: (n: GraphNode) => String(n.label) }]
            : []),
          ...(nodes[0]?.attributes
            ? Object.keys(nodes[0].attributes).map((attribute) => ({
                label: capitalize(attribute),
                accessor: (n: GraphNode) =>
                  String(n.attributes?.[attribute] ?? ""),
              }))
            : []),
        ]
      : [];

  return (
    <div className="flex justify-between items-center h-fit w-full absolute inset-0">
      {/* Import */}
      <div className="m-4 flex-1 flex items-center gap-2">
        <span className="whitespace-nowrap">Database:</span>
        <ImportDropdown
          database={database}
          setDatabase={setDatabase}
          databases={databases}
          addDatabase={addDatabase}
          className="flex-1 max-w-[200px]"
        />
      </div>
      <div className="flex-1 flex justify-end h-18">
        {/* Search */}
        <GraphRendererSearch
          nodes={nodes}
          accessors={accessors}
          onSelect={(n) => zoomToNode(n)}
          className="p-4 rounded-md h-max"
        />
        {/* TODO: Export */}
      </div>
    </div>
  );
}

function GraphRendererSearch({
  nodes,
  accessors,
  onSelect,
  className,
}: {
  nodes: GraphNode[];
  accessors: Accessor[]; // At least one element
  onSelect: (node: GraphNode | null) => void;
  className?: string;
}) {
  // Refs
  const inputRef = useRef<HTMLInputElement | null>(null);

  // States
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentAccessorIdx, setCurrentAccessorIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Memoized values
  const currentAccessor = useMemo(
    () => accessors[currentAccessorIdx],
    [accessors, currentAccessorIdx]
  );

  const filteredNodes = useMemo(
    () =>
      nodes.filter((node) =>
        currentAccessor
          .accessor(node)
          .toLowerCase()
          .includes(searchText.toLowerCase())
      ),
    [nodes, currentAccessor, searchText]
  );

  // Focus to input when search bar expands
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [isExpanded]);

  // Functions
  const handleOnSelect = (node: GraphNode) => {
    onSelect(node);
    setSearchText(currentAccessor.accessor(node));
    inputRef.current?.blur(); // remove input focus
  };

  return !isExpanded ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      autoFocus
      onClick={() => setIsExpanded(true)}
      className="m-4"
    >
      <Search />
    </Button>
  ) : (
    <div
      className={cn(
        "flex gap-2 animate-in slide-in-from-right-0 duration-250 ease-out",
        className
      )}
    >
      {/* Input */}
      <div className="relative">
        <Command shouldFilter={false}>
          <CommandInput
            ref={inputRef}
            value={searchText}
            onValueChange={setSearchText}
            placeholder={`Find by ${currentAccessor.label}...`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {/* List of nodes */}
          {isFocused && (
            <CommandList className="absolute w-full mt-2 top-full left-0 z-50 max-h-48 rounded-md border border-border">
              <CommandEmpty>No results found</CommandEmpty>
              <CommandGroup>
                {filteredNodes.map((node, index) => {
                  const value = currentAccessor.accessor(node);
                  return (
                    <CommandItem
                      key={index}
                      value={value}
                      onSelect={() => handleOnSelect(node)}
                    >
                      <span>{value}</span>
                      <span className="text-typography-tertiary truncate">
                        {/* Other accessors' values */}
                        {accessors
                          .filter((_, i) => i !== currentAccessorIdx)
                          .map((a) => `${a.label}: ${a.accessor(node)}`)
                          .join(" . ")}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </div>
      {/* Select Accessors */}
      <Select
        value={String(currentAccessorIdx)}
        onValueChange={(idx) => {
          setCurrentAccessorIdx(Number(idx));
          setSearchText(""); // reset search
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {accessors.map((accessor, index) => (
            <SelectItem key={index} value={String(index)}>
              {accessor.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Close button */}
      <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
        <X />
      </Button>
    </div>
  );
}

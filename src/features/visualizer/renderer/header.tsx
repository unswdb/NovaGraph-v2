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
import { cn } from "~/lib/utils";
import DatabaseImport from "./import";

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

  // Decide whether to include a "Name" accessor in Cosmograph search UI
  const allNodesHaveName = nodes.every((n) => n.name);
  const nameAccessor = allNodesHaveName
    ? [{ label: "Name", accessor: (n: GraphNode) => n.name as string }]
    : [];

  return (
    <div className="flex justify-between items-center flex-wrap h-fit w-full absolute inset-0">
      {/* Import */}
      <div className="m-4 flex-1 flex items-center gap-2">
        <span className="whitespace-nowrap">Database:</span>
        <DatabaseImport
          database={database}
          setDatabase={setDatabase}
          databases={databases}
          addDatabase={addDatabase}
          className="flex-1"
        />
      </div>
      <div className="flex-1 flex justify-end h-18">
        {/* Search */}
        <GraphRendererSearch
          nodes={nodes}
          accessors={[{ label: "ID", accessor: (n) => n.id }, ...nameAccessor]}
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
  accessors: [Accessor, ...Accessor[]]; // At least one element
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

  // Return only just the search icon if expanded
  if (!isExpanded) {
    return (
      <div className="m-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <Search />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full animate-in slide-in-from-right-0 duration-250 ease-out",
        className
      )}
    >
      <Command shouldFilter={false}>
        <div className="flex justify-between items-center gap-1">
          {/* Input */}
          <CommandInput
            ref={inputRef}
            value={searchText}
            onValueChange={setSearchText}
            placeholder={`Find by ${currentAccessor.label}...`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {/* Select Accessors */}
          <Select
            value={String(currentAccessorIdx)}
            onValueChange={(idx) => setCurrentAccessorIdx(Number(idx))}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <X className="text-typography-tertiary" />
          </Button>
        </div>
        {/* List of nodes */}
        {isFocused && (
          <CommandList className="absolute w-full top-full left-0 z-50 max-h-48 rounded-md border border-border">
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
                    <span>
                      {currentAccessor.label}: {value}
                    </span>
                    <span className="text-typography-tertiary">
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
  );
}

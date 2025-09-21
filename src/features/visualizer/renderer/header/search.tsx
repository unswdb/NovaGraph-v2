import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/form/select";
import type { GraphNode } from "../../types";
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
import { cn } from "~/lib/utils";
import type { Accessor } from ".";
import { useIsMobile } from "~/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Input } from "~/components/form/input";

export default function GraphRendererSearch({
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

  // Hooks
  const isMobile = useIsMobile();

  // States
  const [searchText, setSearchText] = useState("");
  const [currentAccessorIdx, setCurrentAccessorIdx] = useState(0);

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

  // Functions
  const handleOnSelect = (node: GraphNode) => {
    onSelect(node);
    setSearchText(currentAccessor.accessor(node));
    inputRef.current?.blur(); // remove input focus
  };

  return isMobile ? (
    <MobileSearch
      className={className}
      inputRef={inputRef}
      searchText={searchText}
      setSearchText={setSearchText}
      accessors={accessors}
      currentAccessorIdx={currentAccessorIdx}
      setCurrentAccessorIdx={setCurrentAccessorIdx}
      currentAccessor={currentAccessor}
      filteredNodes={filteredNodes}
      handleOnSelect={handleOnSelect}
    />
  ) : (
    <DesktopSearch
      className={className}
      inputRef={inputRef}
      searchText={searchText}
      setSearchText={setSearchText}
      accessors={accessors}
      currentAccessorIdx={currentAccessorIdx}
      setCurrentAccessorIdx={setCurrentAccessorIdx}
      currentAccessor={currentAccessor}
      filteredNodes={filteredNodes}
      handleOnSelect={handleOnSelect}
    />
  );
}

function MobileSearch({
  inputRef,
  searchText,
  setSearchText,
  accessors,
  currentAccessorIdx,
  setCurrentAccessorIdx,
  currentAccessor,
  filteredNodes,
  handleOnSelect,
}: {
  className?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  searchText: string;
  setSearchText: (text: string) => void;
  accessors: Accessor[];
  currentAccessorIdx: number;
  setCurrentAccessorIdx: (idx: number) => void;
  currentAccessor: Accessor;
  filteredNodes: GraphNode[];
  handleOnSelect: (node: GraphNode) => void;
}) {
  // Refs
  const listRef = useRef<HTMLDivElement | null>(null);

  // States
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Reset index when filtered nodes change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredNodes]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredNodes.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredNodes.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredNodes.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredNodes.length) {
          handleOnSelect(filteredNodes[selectedIndex]);
          setIsSheetOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleMouseEnter = (index: number) => {
    setSelectedIndex(index);
  };

  const handleItemClick = (node: GraphNode) => {
    handleOnSelect(node);
    setIsSheetOpen(false);
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          autoFocus
          className="m-4"
        >
          <Search />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-3/4 p-4">
        <SheetHeader className="text-center">
          <SheetTitle>Search Nodes</SheetTitle>
          <SheetDescription>Find nodes by their attributes.</SheetDescription>
        </SheetHeader>
        <div className="flex items-center gap-2 ">
          {/* Search Input */}
          <div className="flex-1 flex items-center gap-2 border-b border-border">
            <Search />
            <Input
              ref={inputRef}
              value={searchText}
              variant="ghost"
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Find by ${currentAccessor.label}...`}
              autoFocus
            />
          </div>
          {/* Select Accessors */}
          <Select
            value={String(currentAccessorIdx)}
            onValueChange={(idx) => {
              setCurrentAccessorIdx(Number(idx));
              setSearchText(""); // reset search
              setSelectedIndex(-1); // reset selected index
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
        </div>
        {/* List of nodes */}
        <div>
          {filteredNodes.length === 0 ? (
            <p className="text-sm text-typography-secondary text-center">
              No results found
            </p>
          ) : (
            <div
              role="listbox"
              ref={listRef}
              className="max-h-48 overflow-y-auto"
              aria-label="Seach results"
            >
              {filteredNodes.map((node, index) => {
                const value = currentAccessor.accessor(node);
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={index}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "p-3 rounded-md cursor-pointer border-b border-b-border last:border-0",
                      isSelected && "bg-neutral-low"
                    )}
                    onClick={() => handleItemClick(node)}
                    onMouseEnter={() => handleMouseEnter(index)}
                  >
                    <div className="font-medium text-sm">{value}</div>
                    {accessors.filter((_, i) => i !== currentAccessorIdx)
                      .length > 0 && (
                      <div className="text-xs text-typography-secondary truncate mt-1">
                        {accessors
                          .filter((_, i) => i !== currentAccessorIdx)
                          .map((a) => `${a.label}: ${a.accessor(node)}`)
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DesktopSearch({
  className,
  inputRef,
  searchText,
  setSearchText,
  accessors,
  currentAccessorIdx,
  setCurrentAccessorIdx,
  currentAccessor,
  filteredNodes,
  handleOnSelect,
}: {
  className?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  searchText: string;
  setSearchText: (text: string) => void;
  accessors: Accessor[];
  currentAccessorIdx: number;
  setCurrentAccessorIdx: (idx: number) => void;
  currentAccessor: Accessor;
  filteredNodes: GraphNode[];
  handleOnSelect: (node: GraphNode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Focus to input when search bar expands
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [isExpanded]);

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
            <CommandList className="absolute min-w-full max-w-60 mt-2 top-full left-0 z-50 max-h-40 rounded-md border border-border">
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

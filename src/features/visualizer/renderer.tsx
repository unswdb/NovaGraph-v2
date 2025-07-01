import {
  Cosmograph,
  CosmographProvider,
  type CosmographRef,
} from "@cosmograph/react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode } from "./visualizer.types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "~/components/form/select";
import { cn } from "~/lib/utils";
import {
  CRITICAL_COLOR,
  DEFAULT_LINK_WIDTH,
  DEFAULT_NODE_SIZE,
  DISABLED_COLOR,
  GRADIENT_COLOR,
  HIGHLIGHTED_LINK_WIDTH,
  INACTIVE_NODE_SIZE,
  MODE,
  NEUTRAL_COLOR,
  NEUTRAL_LOW_COLOR,
} from "./visualizer.constant";
import type { ColorMap, SizeMap } from "./algorithms/implementations";
import { useTheme } from "~/hooks/use-theme";

export default function GraphRenderer({
  nodes,
  edges,
  directed,
  sizes,
  colors,
  mode,
  gravity,
  nodeSizeScale,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  sizes: SizeMap;
  colors: ColorMap; // From algorithm's response
  mode: number; // From algorithm's response
  gravity: number; // From settings sidebar
  nodeSizeScale: number; // From settings sidebar
}) {
  // Refs
  const cosmographRef = useRef<CosmographRef<GraphNode, GraphEdge> | null>(
    null
  );

  // States
  const [showDynamicLabels, setShowDynamicLabels] = useState(true);

  // Hooks
  const { theme } = useTheme();

  // Decide whether to include a "Name" accessor in Cosmograph search UI
  const allNodesHaveName = nodes.every((n) => n.name);
  const nameAccessor = allNodesHaveName
    ? [{ label: "Name", accessor: (n: GraphNode) => n.name as string }]
    : [];

  // Zoom in/out functions
  const zoomOut = useCallback(() => {
    cosmographRef.current?.unselectNodes();
    cosmographRef.current?.fitView(500);
  }, []);

  const zoomToNode = useCallback(
    (node: GraphNode | null | undefined) => {
      if (node) {
        cosmographRef.current?.selectNode(node);
        cosmographRef.current?.zoomToNode(node);
      } else {
        zoomOut();
      }
    },
    [zoomOut]
  );

  // Renderer appearance attributes related functions
  const getSize = (index: number) => {
    if (mode === MODE.COLOR_SHADE_DEFAULT && isNaN(colors[index])) {
      return INACTIVE_NODE_SIZE;
    }
    return sizes[index] ? sizes[index] : DEFAULT_NODE_SIZE;
  };

  const getColor = (index: number) => {
    switch (mode) {
      case MODE.COLOR_IMPORTANT:
        return colors[index] > 0
          ? GRADIENT_COLOR(1).hex()
          : colors[index] < 0
          ? CRITICAL_COLOR
          : NEUTRAL_COLOR;
      case MODE.COLOR_SHADE_DEFAULT:
        return isNaN(colors[index])
          ? DISABLED_COLOR
          : GRADIENT_COLOR(colors[index]).hex();
      case MODE.COLOR_SHADE_ERROR:
        return isNaN(colors[index])
          ? CRITICAL_COLOR
          : GRADIENT_COLOR(colors[index]).hex();
      case MODE.SIZE_SCALAR:
        return NEUTRAL_COLOR;
      case MODE.RAINBOW:
        return `hsl(${colors[index] * 137.508 + 50},100%,75%)`;
      default:
        return NEUTRAL_COLOR;
    }
  };

  const getLinkColor = (link: GraphEdge) => {
    if (colors[`${link.source}-${link.target}`] > 0) {
      return NEUTRAL_LOW_COLOR;
    } else if (!directed && colors[`${link.target}-${link.source}`] > 0) {
      return NEUTRAL_LOW_COLOR;
    } else if (colors[`${link.target}-${link.source}`] === 0) {
      return GRADIENT_COLOR(1).hex();
    } else if (!directed && colors[`${link.source}-${link.target}`] === 0) {
      return GRADIENT_COLOR(1).hex();
    } else {
      return null;
    }
  };

  const getLinkWidth = (link: GraphEdge) => {
    if (colors[`${link.source}-${link.target}`] >= 0) {
      return HIGHLIGHTED_LINK_WIDTH;
    } else if (!directed && colors[`${link.target}-${link.source}`] >= 0) {
      return HIGHLIGHTED_LINK_WIDTH;
    } else {
      return DEFAULT_LINK_WIDTH;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CosmographProvider nodes={nodes} links={edges}>
        <div className="p-2">
          <GraphRendererSearch
            nodes={nodes}
            accessors={[
              { label: "ID", accessor: (n) => n.id },
              ...nameAccessor,
            ]}
            onSelect={(n) => zoomToNode(n)}
            className="p-4 rounded-md h-max"
          />
        </div>
        <Cosmograph
          ref={cosmographRef}
          onClick={zoomToNode}
          initialZoomLevel={1}
          nodeSize={(_, id) => getSize(id)}
          nodeColor={(_, id) => getColor(colors[id])}
          nodeGreyoutOpacity={0.1}
          nodeLabelAccessor={(node) => (node.name ? node.name : node.id)}
          nodeSizeScale={nodeSizeScale}
          linkColor={(link) => getLinkColor(link)}
          linkWidth={(link) => getLinkWidth(link)}
          linkArrows={directed}
          linkGreyoutOpacity={0}
          simulationLinkDistance={20}
          simulationLinkSpring={0.02}
          simulationDecay={100000}
          simulationRepulsion={2}
          simulationGravity={gravity}
          disableSimulation={false}
          showDynamicLabels={showDynamicLabels}
          hoveredNodeRingColor={"var(--color-positive)"}
          renderHoveredNodeRing={true}
          backgroundColor="transparent"
          hoveredNodeLabelColor="white"
          nodeLabelColor="white"
          className="bg-page flex-1"
        />
      </CosmographProvider>
    </div>
  );
}

type Accessor = { label: string; accessor: (n: GraphNode) => string };

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

  // Functions
  const handleOnSelect = (node: GraphNode) => {
    onSelect(node);
    setSearchText(currentAccessor.accessor(node));
    inputRef.current?.blur(); // remove input focus
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Command className="h-auto" shouldFilter={false}>
        <div className="flex justify-between gap-2 items-center">
          {/* Input */}
          <CommandInput
            ref={inputRef}
            value={searchText}
            onValueChange={setSearchText}
            placeholder={`Find by ${currentAccessor.label}...`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {/* Select accessors */}
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
        </div>
        {/* List of nodes */}
        {isFocused && (
          <CommandList className="absolute w-full top-full left-0 z-50 max-h-64 rounded-md border border-border">
            <CommandEmpty>No results found.</CommandEmpty>
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

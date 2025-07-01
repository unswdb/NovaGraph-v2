import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Waypoints,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Input } from "~/components/form/input";
import { Separator } from "~/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";
import { useIsMobile } from "~/hooks/use-mobile";
import ALL_ALGORITHMS, {
  type BaseGraphAlgorithm,
  type BaseGraphAlgorithmResult,
} from "./implementations";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import AlgorithmInputModal from "./input";
import { cn } from "~/lib/utils";
import type { GraphEdge, GraphModule, GraphNode } from "../visualizer.types";

export default function AlgorithmSidebar({
  module,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
}: {
  module: GraphModule | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult) => void;
}) {
  return (
    <SidebarProvider name="algorithm-sidebar" className="relative isolate z-10">
      <Sidebar side="left">
        <AlgorithmSidebarContent
          module={module}
          nodes={nodes}
          edges={edges}
          setActiveAlgorithm={setActiveAlgorithm}
          setActiveResponse={setActiveResponse}
        />
      </Sidebar>
      <AlgorithmSidebarControls />
    </SidebarProvider>
  );
}

function AlgorithmSidebarContent({
  module,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
}: {
  module: GraphModule | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult) => void;
}) {
  const { state } = useSidebar();
  const [searchText, setSearchText] = useState("");

  return (
    <SidebarContent className="p-6 space-y-4 bg-gradient-to-br from-neutral-low/20 to-neutral/20">
      <SearchBar
        searchText={searchText}
        setSearchText={setSearchText}
        inert={state === "collapsed"}
      />
      {!!searchText ? (
        <FilteredAlgorithmList
          searchText={searchText}
          module={module}
          nodes={nodes}
          edges={edges}
          setActiveAlgorithm={setActiveAlgorithm}
          setActiveResponse={setActiveResponse}
          isCollapsed={state === "collapsed"}
        />
      ) : (
        <UnfilteredAlgorithmList
          module={module}
          nodes={nodes}
          edges={edges}
          setActiveAlgorithm={setActiveAlgorithm}
          setActiveResponse={setActiveResponse}
          isCollapsed={state === "collapsed"}
        />
      )}
    </SidebarContent>
  );
}

function UnfilteredAlgorithmList({
  module,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
  isCollapsed,
}: {
  module: GraphModule | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult) => void;
  isCollapsed: boolean;
}) {
  return (
    <div className="space-y-2">
      <h1 className="xsmall-title text-typography-secondary">
        Graph Algorithms
      </h1>
      {ALL_ALGORITHMS.map((algorithm) => (
        <Collapsible
          key={algorithm.label}
          defaultOpen
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger inert={isCollapsed}>
                {/* Algorithm Category Icon + Label */}
                <div className="flex gap-2 items-center">
                  <algorithm.icon className="w-4 h-4" />
                  {algorithm.label}
                </div>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Algorithms in the Algorithm Category */}
                  {algorithm.algorithms.map((algo) => (
                    <SidebarMenuItem key={algo.title}>
                      <AlgorithmInputModal
                        module={module}
                        algorithm={algo}
                        nodes={nodes}
                        edges={edges}
                        setActiveAlgorithm={setActiveAlgorithm}
                        setActiveResponse={setActiveResponse}
                        inert={isCollapsed}
                        separator
                      />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      ))}
    </div>
  );
}

function FilteredAlgorithmList({
  searchText,
  module,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
  isCollapsed,
}: {
  searchText: string;
  module: GraphModule | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult) => void;
  isCollapsed: boolean;
}) {
  const allAlgorithms: BaseGraphAlgorithm[] = ALL_ALGORITHMS.reduce(
    (acc, { algorithms }) => [...acc, ...algorithms],
    [] as BaseGraphAlgorithm[]
  );

  const filteredAlgorithms = useMemo(
    () =>
      allAlgorithms.filter((algorithm) =>
        algorithm.title.toLowerCase().includes(searchText.toLowerCase())
      ),
    [searchText]
  );

  return (
    <div className="space-y-2">
      <h1 className="xsmall-title text-typography-secondary">
        Search Results ({filteredAlgorithms.length})
      </h1>
      <SidebarMenu>
        {filteredAlgorithms.map((algo) => (
          <SidebarMenuItem key={algo.title}>
            <AlgorithmInputModal
              module={module}
              algorithm={algo}
              nodes={nodes}
              edges={edges}
              setActiveAlgorithm={setActiveAlgorithm}
              setActiveResponse={setActiveResponse}
              inert={isCollapsed}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}

function SearchBar({
  searchText,
  setSearchText,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  searchText: string;
  setSearchText: (s: string) => void;
}) {
  return (
    <div
      className={cn(
        "px-2 py-1 flex items-center gap-1 border border-border rounded-md",
        className
      )}
    >
      <Search className="w-4 h-4" />
      <Input
        type="text"
        variant="ghost"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search for Algorithms..."
        {...props}
      />
    </div>
  );
}

function AlgorithmSidebarControls() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div
      className={`bg-page p-2 flex flex-col items-center gap-2 h-max absolute top-1/2 -translate-y-1/2 ${
        state === "collapsed" || isMobile
          ? "left-0"
          : "left-[calc(var(--sidebar-width))]"
      } transition-all duration-200 ease-linear border border-l-transparent border-border rounded-tr-md rounded-br-md`}
    >
      <SidebarTrigger size="icon">
        {state === "collapsed" || isMobile ? (
          <ChevronsRight className="w-6 h-6" />
        ) : (
          <ChevronsLeft className="w-6 h-6" />
        )}
      </SidebarTrigger>
      <Separator />
      <Waypoints className="w-6 h-6" />
    </div>
  );
}

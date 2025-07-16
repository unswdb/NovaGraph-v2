import { ChevronsLeft, ChevronsRight, Search, Waypoints } from "lucide-react";
import React, { useState } from "react";
import { Input } from "~/components/form/input";
import { Separator } from "~/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";
import { useIsMobile } from "~/hooks/use-mobile";
import {
  type BaseGraphAlgorithm,
  type BaseGraphAlgorithmResult,
} from "../implementations";
import { cn } from "~/lib/utils";
import type { GraphEdge, GraphModule, GraphNode } from "../../types";
import {
  FilteredAlgorithmList,
  UnfilteredAlgorithmList,
} from "./algorithm-list";

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
  const [hoveredAlgorithm, setHoveredAlgorithm] =
    useState<BaseGraphAlgorithm | null>(null);

  return (
    <SidebarContent className="p-6 space-y-4 bg-gradient-to-br from-neutral-low/20 to-neutral/20">
      {/* Search Bar */}
      <SearchBar
        searchText={searchText}
        setSearchText={setSearchText}
        inert={state === "collapsed"}
      />
      {/* Algorithm List */}
      {!!searchText ? (
        <FilteredAlgorithmList
          searchText={searchText}
          module={module}
          nodes={nodes}
          edges={edges}
          setActiveAlgorithm={setActiveAlgorithm}
          setActiveResponse={setActiveResponse}
          onAlgorithmHover={setHoveredAlgorithm}
          isCollapsed={state === "collapsed"}
        />
      ) : (
        <UnfilteredAlgorithmList
          module={module}
          nodes={nodes}
          edges={edges}
          setActiveAlgorithm={setActiveAlgorithm}
          setActiveResponse={setActiveResponse}
          onAlgorithmHover={setHoveredAlgorithm}
          isCollapsed={state === "collapsed"}
        />
      )}
      {/* Hovered Algorithm Description */}
      <div
        className={cn(
          "p-4 bg-tabdock flex flex-col gap-2 rounded-md transition-all duration-300 ease-out",
          !!hoveredAlgorithm ? "opacity-100 h-fit" : "opacity-0 h-0"
        )}
      >
        <p className="font-semibold small-title flex-1">
          {hoveredAlgorithm?.title}
        </p>
        <p className="small-body text-typography-secondary">
          {hoveredAlgorithm?.description}
        </p>
      </div>
    </SidebarContent>
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
        autoFocus
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
      className={`bg-gradient-to-br from-neutral-low/20 to-neutral/20 p-2 flex flex-col items-center gap-2 h-max absolute top-1/2 -translate-y-1/2 ${
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

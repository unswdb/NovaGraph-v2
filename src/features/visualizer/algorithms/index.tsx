import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Waypoints,
} from "lucide-react";
import React, { useState } from "react";
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
import ALL_ALGORITHMS from "./implementations";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import AlgorithmInputModal from "./input";
import { cn } from "~/lib/utils";
import type { GraphEdge, GraphNode } from "../types";

export default function AlgorithmSidebar({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  return (
    <SidebarProvider name="algorithm-sidebar" className="relative isolate z-10">
      <Sidebar side="left">
        <AlgorithmSidebarContent nodes={nodes} edges={edges} />
      </Sidebar>
      <AlgorithmSidebarControls />
    </SidebarProvider>
  );
}

function AlgorithmSidebarContent({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const { state } = useSidebar();
  const [searchText, setSearchText] = useState("");

  return (
    <SidebarContent className="p-6 space-y-4">
      <SearchBar
        searchText={searchText}
        setSearchText={setSearchText}
        inert={state === "collapsed"}
      />
      {/* List of Graph Algorithms */}
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
                <CollapsibleTrigger inert={state === "collapsed"}>
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
                          algorithm={algo}
                          nodes={nodes}
                          edges={edges}
                          inert={state === "collapsed"}
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
      className={`p-2 flex flex-col items-center gap-2 h-max absolute top-1/2 -translate-y-1/2 ${
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

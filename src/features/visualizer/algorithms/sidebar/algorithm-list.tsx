import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

import type { GraphEdge, GraphNode } from "../../types";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "../implementations";
import ALL_ALGORITHMS from "../implementations";
import InputDialog from "../input-dialog";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type VisualizerStore from "../../store";

export function UnfilteredAlgorithmList({
  controller,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
  isCollapsed,
}: {
  controller: VisualizerStore["controller"];
  nodes: GraphNode[];
  edges: GraphEdge[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult) => void;
  isCollapsed: boolean;
}) {
  return (
    <div className="space-y-2 flex-1 overflow-y-auto">
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
                  <p className="truncate">{algorithm.label}</p>
                </div>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <TooltipProvider>
                    {/* Algorithms in the Algorithm Category */}
                    {algorithm.algorithms.map((algo) => (
                      <SidebarMenuItem key={algo.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InputDialog
                              controller={controller}
                              algorithm={algo}
                              nodes={nodes}
                              edges={edges}
                              setActiveAlgorithm={setActiveAlgorithm}
                              setActiveResponse={setActiveResponse}
                              inert={isCollapsed}
                              separator
                            />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="w-40">
                            {algo.description}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    ))}
                  </TooltipProvider>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      ))}
    </div>
  );
}

export function FilteredAlgorithmList({
  controller,
  searchText,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
  isCollapsed,
}: {
  controller: VisualizerStore["controller"];
  searchText: string;
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
    <div className="space-y-2 flex-1 overflow-y-auto">
      <h1 className="xsmall-title text-typography-secondary">
        Search Results ({filteredAlgorithms.length})
      </h1>
      <SidebarMenu>
        <TooltipProvider>
          {filteredAlgorithms.map((algo) => (
            <SidebarMenuItem key={algo.title}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputDialog
                    controller={controller}
                    algorithm={algo}
                    nodes={nodes}
                    edges={edges}
                    setActiveAlgorithm={setActiveAlgorithm}
                    setActiveResponse={setActiveResponse}
                    inert={isCollapsed}
                    separator
                  />
                </TooltipTrigger>
                <TooltipContent side="right" className="w-40">
                  {algo.description}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          ))}
        </TooltipProvider>
      </SidebarMenu>
    </div>
  );
}

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import type { GraphEdge, GraphModule, GraphNode } from "../../types";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "../implementations";
import ALL_ALGORITHMS from "../implementations";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { ChevronDown } from "lucide-react";
import InputDialog from "./input-dialog";
import { useMemo } from "react";

export function UnfilteredAlgorithmList({
  module,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
  onAlgorithmHover,
  isCollapsed,
}: {
  module: GraphModule | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult) => void;
  onAlgorithmHover: (a: BaseGraphAlgorithm | null) => void;
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
                      <InputDialog
                        module={module}
                        algorithm={algo}
                        nodes={nodes}
                        edges={edges}
                        setActiveAlgorithm={setActiveAlgorithm}
                        setActiveResponse={setActiveResponse}
                        onMouseEnter={() => onAlgorithmHover(algo)}
                        onMouseLeave={() => onAlgorithmHover(null)}
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

export function FilteredAlgorithmList({
  searchText,
  module,
  nodes,
  edges,
  setActiveAlgorithm,
  setActiveResponse,
  onAlgorithmHover,
  isCollapsed,
}: {
  searchText: string;
  module: GraphModule | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult) => void;
  onAlgorithmHover: (a: BaseGraphAlgorithm | null) => void;
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
        {filteredAlgorithms.map((algo) => (
          <SidebarMenuItem key={algo.title}>
            <InputDialog
              module={module}
              algorithm={algo}
              nodes={nodes}
              edges={edges}
              setActiveAlgorithm={setActiveAlgorithm}
              setActiveResponse={setActiveResponse}
              onMouseEnter={() => onAlgorithmHover(algo)}
              onMouseLeave={() => onAlgorithmHover(null)}
              inert={isCollapsed}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}

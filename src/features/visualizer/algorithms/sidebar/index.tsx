import { ChevronsLeft, ChevronsRight, Search, Waypoints } from "lucide-react";
import { useState } from "react";
import { observer } from "mobx-react-lite";

import {
  type BaseGraphAlgorithm,
  type BaseGraphAlgorithmResult,
} from "../implementations";
import type { GraphNode } from "../../types";
import { useStore } from "../../hooks/use-store";
import type VisualizerStore from "../../store";

import {
  FilteredAlgorithmList,
  UnfilteredAlgorithmList,
} from "./algorithm-list";

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
import { cn } from "~/lib/utils";

export default function AlgorithmSidebar() {
  return (
    <SidebarProvider name="algorithm-sidebar" className="relative isolate z-10">
      <AlgorithmSidebarWrapper />
    </SidebarProvider>
  );
}

const AlgorithmSidebarWrapper = observer(() => {
  const isMobile = useIsMobile();
  const { open, openMobile } = useSidebar();

  const { controller, database, setActiveAlgorithm, setActiveResponse } =
    useStore();

  return (
    <>
      <Sidebar side="left">
        <AlgorithmSidebarContent
          controller={controller}
          open={isMobile ? openMobile : open}
          nodes={database?.graph.nodes ?? []}
          setActiveAlgorithm={setActiveAlgorithm}
          setActiveResponse={setActiveResponse}
        />
      </Sidebar>
      <AlgorithmSidebarControls open={isMobile ? openMobile : open} />
    </>
  );
});

function AlgorithmSidebarContent({
  controller,
  open,
  nodes,
  setActiveAlgorithm,
  setActiveResponse,
}: {
  controller: VisualizerStore["controller"];
  open: boolean;
  nodes: GraphNode[];
  setActiveAlgorithm: (a: BaseGraphAlgorithm | null) => void;
  setActiveResponse: (a: BaseGraphAlgorithmResult | null) => void;
}) {
  const [searchText, setSearchText] = useState("");

  return (
    <SidebarContent className="h-screen p-6 flex flex-col gap-4 bg-gradient-to-br from-neutral-low/20 to-neutral/20">
      {/* Search Bar */}
      <SearchBar
        searchText={searchText}
        setSearchText={setSearchText}
        disabled={!open}
        inert={!open}
      />
      {/* Algorithm List */}
      {!!searchText ? (
        <FilteredAlgorithmList
          controller={controller}
          searchText={searchText}
          nodes={nodes}
          setActiveAlgorithm={setActiveAlgorithm}
          setActiveResponse={setActiveResponse}
          isCollapsed={!open}
        />
      ) : (
        <UnfilteredAlgorithmList
          controller={controller}
          nodes={nodes}
          setActiveAlgorithm={setActiveAlgorithm}
          setActiveResponse={setActiveResponse}
          isCollapsed={!open}
        />
      )}
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
        id="algorithm-search-bar"
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

function AlgorithmSidebarControls({ open }: { open: boolean }) {
  const isMobile = useIsMobile();

  return (
    <div
      className={`bg-page isolate overflow-hidden before:absolute before:bg-gradient-to-br before:from-neutral-low/20 before:to-neutral/20 before:inset-0 before:-z-10 p-2 flex flex-col items-center gap-2 h-max absolute top-1/2 -translate-y-1/2 ${
        !open || isMobile ? "left-0" : "left-[calc(var(--sidebar-width))]"
      } transition-all duration-200 ease-linear border border-l-transparent border-border rounded-tr-md rounded-br-md`}
    >
      <SidebarTrigger size="icon" title="Open Algorithm Sidebar">
        {!open || isMobile ? (
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

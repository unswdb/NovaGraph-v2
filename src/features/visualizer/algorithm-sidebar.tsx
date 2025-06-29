import { ChevronsLeft, ChevronsRight, Search, Waypoints } from "lucide-react";
import { useState } from "react";
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

export default function AlgorithmSidebar() {
  const [searchText, setSearchText] = useState("");

  return (
    <SidebarProvider name="algorithm-sidebar" className="relative isolate z-10">
      <Sidebar side="left">
        <SidebarContent className="p-4">
          <SearchBar searchText={searchText} setSearchText={setSearchText} />
        </SidebarContent>
      </Sidebar>
      <AlgorithmSidebarControls />
    </SidebarProvider>
  );
}

function SearchBar({
  searchText,
  setSearchText,
}: {
  searchText: string;
  setSearchText: (s: string) => void;
}) {
  return (
    <div className="px-2 py-1 flex items-center gap-1 border border-border rounded-md">
      <Search className="w-4 h-4" />
      <Input
        type="text"
        variant="ghost"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search for Algorithms..."
      />
    </div>
  );
}

function AlgorithmSidebarControls() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div
      className={`p-2 space-y-2 h-max absolute top-1/2 -translate-y-1/2 ${
        state === "collapsed" || isMobile
          ? "left-0"
          : "left-[calc(var(--sidebar-width))]"
      } transition-all duration-200 ease-linear border border-l-transparent border-border rounded-tr-md rounded-br-md`}
    >
      <SidebarTrigger asChild>
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

import { ChevronsLeft, ChevronsRight, Settings } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";
import { useIsMobile } from "~/hooks/use-mobile";

export default function ConfigSidebar() {
  return (
    <SidebarProvider name="config-sidebar" className="relative isolate z-10">
      <Sidebar side="right">
        <SidebarContent className="p-4">
          <h1 className="medium-title">Graph Options</h1>

          {/* Gravity Strength */}
          <h2 className="small-title">Gravity Strength</h2>
          <p>Modifies the gravitation strength of the center of the graph</p>

          {/* Node Scalar Size */}
          <h2 className="small-title">Node Scalar Size</h2>
          <p>Modify the sizes for all nodes</p>
        </SidebarContent>
      </Sidebar>
      <ConfigSidebarControls />
    </SidebarProvider>
  );
}

function ConfigSidebarControls() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div
      className={`p-2 space-y-2 h-max absolute top-1/2 -translate-y-1/2 ${
        state === "collapsed" || isMobile
          ? "right-0"
          : "right-[calc(var(--sidebar-width))]"
      } transition-all duration-200 ease-linear border border-r-transparent border-border rounded-tl-md rounded-bl-md`}
    >
      <SidebarTrigger asChild>
        {state === "collapsed" || isMobile ? (
          <ChevronsLeft className="w-6 h-6" />
        ) : (
          <ChevronsRight className="w-6 h-6" />
        )}
      </SidebarTrigger>
      <Separator />
      <Settings className="w-6 h-6" />
    </div>
  );
}

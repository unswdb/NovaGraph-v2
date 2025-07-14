import { ChevronsLeft, ChevronsRight, Settings } from "lucide-react";
import { Label } from "~/components/form/label";
import { RadioGroup, RadioGroupItem } from "~/components/form/radio-group";
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
  GRAVITY,
  NODE_SIZE_SCALE,
  type Gravity,
  type NodeSizeScale,
} from "./constant";

export default function SettingsSidebar({
  gravity,
  setGravity,
  nodeSizeScale,
  setNodeSizeScale,
}: {
  gravity: Gravity;
  setGravity: (g: Gravity) => void;
  nodeSizeScale: NodeSizeScale;
  setNodeSizeScale: (n: NodeSizeScale) => void;
}) {
  return (
    <SidebarProvider
      name="config-sidebar"
      className="relative isolate z-10"
      defaultOpen={false}
    >
      <Sidebar side="right">
        <SettingsSidebarContent
          gravity={gravity}
          setGravity={setGravity}
          nodeSizeScale={nodeSizeScale}
          setNodeSizeScale={setNodeSizeScale}
        />
      </Sidebar>
      <SettingsSidebarControls />
    </SidebarProvider>
  );
}

function SettingsSidebarContent({
  gravity,
  setGravity,
  nodeSizeScale,
  setNodeSizeScale,
}: {
  gravity: Gravity;
  setGravity: (g: Gravity) => void;
  nodeSizeScale: NodeSizeScale;
  setNodeSizeScale: (n: NodeSizeScale) => void;
}) {
  const { state } = useSidebar();

  return (
    <SidebarContent className="p-6 space-y-4 bg-gradient-to-br from-neutral-low/20 to-neutral/20">
      <h1 className="medium-title">Graph Options</h1>
      {/* Gravity */}
      <div className="space-y-4">
        <div className="space-y-2">
          {/* Title + Description */}
          <h2 className="small-title">Gravity Strength</h2>
          <p className="small-body text-typography-secondary">
            Modifies the gravitation strength of the center of the graph
          </p>
        </div>
        <RadioGroup
          defaultValue={String(gravity)}
          onValueChange={(value) => setGravity(Number(value) as Gravity)}
          inert={state === "collapsed"}
        >
          {/* Gravity options */}
          {Object.entries(GRAVITY).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <RadioGroupItem value={String(val)} id={key} />
              <Label htmlFor={key} className="capitalize font-normal">
                {key.replace(/_/g, " ").toLowerCase()}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      {/* Node Size Scale */}
      <div className="space-y-4">
        <div className="space-y-2">
          {/* Title + Description */}
          <h2 className="small-title">Node Scalar Size</h2>
          <p className="small-body text-typography-secondary">
            Modify the sizes for all nodes
          </p>
        </div>
        <RadioGroup
          defaultValue={String(nodeSizeScale)}
          onValueChange={(value) =>
            setNodeSizeScale(Number(value) as NodeSizeScale)
          }
          inert={state === "collapsed"}
        >
          {/* Node size scale options */}
          {Object.entries(NODE_SIZE_SCALE).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <RadioGroupItem value={String(val)} id={key} />
              <Label htmlFor={key} className="capitalize font-normal">
                {key.replace(/_/g, " ").toLowerCase()}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </SidebarContent>
  );
}

function SettingsSidebarControls() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div
      className={`bg-gradient-to-br from-neutral-low/20 to-neutral/20 p-2 flex flex-col items-center gap-2 h-max absolute top-1/2 -translate-y-1/2 ${
        state === "collapsed" || isMobile
          ? "right-0"
          : "right-[calc(var(--sidebar-width))]"
      } transition-all duration-200 ease-linear border border-r-transparent border-border rounded-tl-md rounded-bl-md`}
    >
      <SidebarTrigger size="icon">
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

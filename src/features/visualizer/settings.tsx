import { ChevronsLeft, ChevronsRight, Settings } from "lucide-react";
import { observer } from "mobx-react-lite";

import {
  GRAVITY,
  NODE_SIZE_SCALE,
  type Gravity,
  type NodeSizeScale,
} from "./renderer/constant";
import { useStore } from "./hooks/use-store";

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

export default function SettingsSidebar() {
  return (
    <SidebarProvider
      name="config-sidebar"
      className="relative isolate z-10"
      defaultOpen={false}
    >
      <SettingsSidebarWrapper />
    </SidebarProvider>
  );
}

const SettingsSidebarWrapper = observer(() => {
  const { gravity, setGravity, nodeSizeScale, setNodeSizeScale } = useStore();

  const isMobile = useIsMobile();
  const { open, openMobile } = useSidebar();

  return (
    <>
      <Sidebar side="right">
        <SettingsSidebarContent
          open={isMobile ? openMobile : open}
          gravity={gravity}
          setGravity={setGravity}
          nodeSizeScale={nodeSizeScale}
          setNodeSizeScale={setNodeSizeScale}
        />
      </Sidebar>
      <SettingsSidebarControls open={isMobile ? openMobile : open} />
    </>
  );
});

function SettingsSidebarContent({
  open,
  gravity,
  setGravity,
  nodeSizeScale,
  setNodeSizeScale,
}: {
  open: boolean;
  gravity: Gravity;
  setGravity: (g: Gravity) => void;
  nodeSizeScale: NodeSizeScale;
  setNodeSizeScale: (n: NodeSizeScale) => void;
}) {
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
          disabled={!open}
          inert={!open}
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
          disabled={!open}
          inert={!open}
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

function SettingsSidebarControls({ open }: { open: boolean }) {
  const isMobile = useIsMobile();

  return (
    <div
      className={`bg-page isolate overflow-hidden before:absolute before:bg-gradient-to-br before:from-neutral-low/20 before:to-neutral/20 before:inset-0 before:-z-10 p-2 flex flex-col items-center gap-2 h-max absolute top-1/2 -translate-y-1/2 ${
        !open || isMobile ? "right-0" : "right-[calc(var(--sidebar-width))]"
      } transition-all duration-200 ease-linear border border-r-transparent border-border rounded-tl-md rounded-bl-md`}
    >
      <SidebarTrigger size="icon">
        {!open || isMobile ? (
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

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
import { GRAVITY, NODE_SCALAR_SIZE } from "./config-sidebar.constants";

const RADIO_GROUPS = [
  {
    title: "Gravity Strength",
    description: "Modifies the gravitation strength of the center of the graph",
    defaultValue: GRAVITY.ZERO_GRAVITY,
    values: [
      {
        label: "Zero Gravity (Default)",
        value: GRAVITY.ZERO_GRAVITY,
      },
      {
        label: "Low Gravity",
        value: GRAVITY.LOW_GRAVITY,
      },
      {
        label: "High Gravity",
        value: GRAVITY.HIGH_GRAVITY,
      },
    ],
  },
  {
    title: "Node Scalar Size",
    description: "Modify the sizes for all nodes",
    defaultValue: NODE_SCALAR_SIZE.MEDIUM,
    values: [
      {
        label: "Invisible",
        value: NODE_SCALAR_SIZE.INVISIBLE,
      },
      {
        label: "Extra Small",
        value: NODE_SCALAR_SIZE.EXTRA_SMALL,
      },
      {
        label: "Small",
        value: NODE_SCALAR_SIZE.SMALL,
      },
      {
        label: "Medium (Default)",
        value: NODE_SCALAR_SIZE.MEDIUM,
      },
      {
        label: "Large",
        value: NODE_SCALAR_SIZE.LARGE,
      },
      {
        label: "Extra Large",
        value: NODE_SCALAR_SIZE.EXTRA_LARGE,
      },
    ],
  },
];

export default function ConfigSidebar() {
  return (
    <SidebarProvider name="config-sidebar" className="relative isolate z-10">
      <Sidebar side="right">
        <SidebarContent className="p-6 space-y-4">
          <h1 className="medium-title">Graph Options</h1>
          {RADIO_GROUPS.map(({ title, description, defaultValue, values }) => (
            <div key={title} className="space-y-3">
              <h2 className="small-title">{title}</h2>
              <p className="small-body text-typography-secondary">
                {description}
              </p>
              <RadioGroup defaultValue={String(defaultValue)}>
                {values.map(({ label, value }) => (
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={String(value)} id={label} />
                    <Label className="font-normal" htmlFor={label}>
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
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

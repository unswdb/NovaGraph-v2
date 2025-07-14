import type { CosmographRef } from "@cosmograph/react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { GraphEdge, GraphNode } from "../types";
import { Button } from "~/components/ui/button";
import {
  Pause,
  Play,
  RotateCcw,
  Shrink,
  Tag,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useZoomControls } from "./hooks/use-zoom-controls";

export default function GraphRendererFooter({
  cosmographRef,
  isSimulationPaused,
  setIsSimulationPaused,
  showDynamicLabels,
  setShowDynamicLabels,
}: {
  cosmographRef: RefObject<CosmographRef<GraphNode, GraphEdge> | null>;
  isSimulationPaused: boolean;
  setIsSimulationPaused: Dispatch<SetStateAction<boolean>>;
  showDynamicLabels: boolean;
  setShowDynamicLabels: Dispatch<SetStateAction<boolean>>;
}) {
  const { fitToScreen, zoomIn, zoomOut } = useZoomControls(cosmographRef);

  return (
    <div className="flex justify-between p-4 w-full absolute bottom-0 left-0">
      {/* Left Side */}
      <div>
        {/* Play/Pause Simulation */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSimulationPaused((prev) => !prev)}
        >
          {isSimulationPaused ? <Play /> : <Pause />}
        </Button>
        {/* Restart Simulation */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => cosmographRef.current?.create()}
        >
          <RotateCcw />
        </Button>
        {/* Fit All Nodes */}
        <Button variant="ghost" size="icon" onClick={() => fitToScreen()}>
          <Shrink />
        </Button>
      </div>
      {/* Right Side */}
      <div>
        {/* Zoom Out */}
        <Button variant="ghost" size="icon" onClick={() => zoomOut()}>
          <ZoomOut />
        </Button>
        {/* Zoom In */}
        <Button variant="ghost" size="icon" onClick={() => zoomIn()}>
          <ZoomIn />
        </Button>
        {/* Dynamic Labels Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDynamicLabels((prev) => !prev)}
        >
          <Tag
            className={
              showDynamicLabels
                ? "stroke-page fill-typography-primary"
                : "stroke-typography-primary fill-page"
            }
          />
        </Button>
      </div>
    </div>
  );
}

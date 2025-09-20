import {
  Cosmograph,
  CosmographProvider,
  type CosmographRef,
} from "@cosmograph/react";
import { useEffect, useRef, useState } from "react";
import type { GraphDatabase, GraphEdge, GraphNode } from "../types";
import { cn } from "~/lib/utils";
import type { ColorMap, SizeMap } from "../algorithms/implementations";
import GraphRendererHeader from "./header";
import GraphRendererFooter from "./footer";
import { useGraphRendererHelpers } from "./hooks/use-graph-renderer-helpers";
import { useZoomControls } from "./hooks/use-zoom-controls";
import NodeAttributesForm from "./node-attributes";

const INITIAL_ZOOM_LEVEL = 1;
const SIMULATION_LINK_DISTANCE = 20;
const SIMULATION_SPRING = 0.02;
const SIMULATION_DECAY = 100000;
const SIMULATION_REPULSION = 2;

export default function GraphRenderer({
  nodes,
  edges,
  directed,
  database,
  databases,
  setDatabase,
  addDatabase,
  sizes,
  colors,
  mode,
  gravity,
  nodeSizeScale,
  className,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  database: GraphDatabase | null;
  databases: GraphDatabase[];
  setDatabase: (g: GraphDatabase) => void;
  addDatabase: (g: GraphDatabase) => void;
  sizes: SizeMap;
  colors: ColorMap; // From algorithm's response
  mode: number; // From algorithm's response
  gravity: number; // From settings sidebar
  nodeSizeScale: number; // From settings sidebar
  className?: string;
}) {
  // Refs
  const cosmographRef = useRef<CosmographRef<GraphNode, GraphEdge> | null>(
    null
  );

  // States
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [showDynamicLabels, setShowDynamicLabels] = useState(true);
  const [clickedNode, setClickedNode] = useState<GraphNode | null>(null);

  // Hooks
  const { getNodeSize, getNodeColor, getLinkColor, getLinkWidth } =
    useGraphRendererHelpers({ mode, colors, sizes, directed });
  const { zoomToNode } = useZoomControls(cosmographRef);

  // Start/pause simulation based on isSimulationPaused state
  useEffect(() => {
    if (isSimulationPaused) {
      cosmographRef.current?.pause();
    } else {
      cosmographRef.current?.start();
    }
  }, [isSimulationPaused]);

  const nodeOnClick = (node: GraphNode | undefined) => {
    zoomToNode(node);
    setClickedNode(node ?? null);
  };

  return (
    <CosmographProvider nodes={nodes} links={edges}>
      <div className={cn("flex flex-col h-full relative", className)}>
        {/* Main Graph Visualizer */}
        <Cosmograph
          ref={cosmographRef}
          onClick={nodeOnClick}
          initialZoomLevel={INITIAL_ZOOM_LEVEL}
          nodeSize={(_, id) => getNodeSize(id)}
          nodeColor={(_, id) => getNodeColor(id)}
          nodeGreyoutOpacity={0.1}
          nodeLabelAccessor={(node) => (node.label ? node.label : node.id)}
          nodeSizeScale={nodeSizeScale}
          linkColor={(link) => getLinkColor(link)}
          linkWidth={(link) => getLinkWidth(link)}
          linkArrows={directed}
          linkGreyoutOpacity={0}
          simulationLinkDistance={SIMULATION_LINK_DISTANCE}
          simulationLinkSpring={SIMULATION_SPRING}
          simulationDecay={SIMULATION_DECAY}
          simulationRepulsion={SIMULATION_REPULSION}
          simulationGravity={gravity}
          disableSimulation={false}
          showDynamicLabels={showDynamicLabels}
          hoveredNodeRingColor="#5f5ffa"
          renderHoveredNodeRing={true}
          backgroundColor="transparent"
          hoveredNodeLabelColor="white"
          nodeLabelColor="white"
          className="bg-page flex-1"
        />

        {/* Node Attributes Form */}
        {clickedNode && (
          <NodeAttributesForm
            node={clickedNode}
            onClose={() => setClickedNode(null)}
          />
        )}

        {/* Top Gradient Overlay */}
        <GradientOverlay position="top" />

        {/* Visualizer Header */}
        <GraphRendererHeader
          database={database}
          setDatabase={setDatabase}
          databases={databases}
          addDatabase={addDatabase}
          cosmographRef={cosmographRef}
          nodes={nodes}
        />

        {/* Bottom Gradient Overlay */}
        <GradientOverlay position="bottom" />

        {/* Footer */}
        <GraphRendererFooter
          cosmographRef={cosmographRef}
          isSimulationPaused={isSimulationPaused}
          setIsSimulationPaused={setIsSimulationPaused}
          showDynamicLabels={showDynamicLabels}
          setShowDynamicLabels={setShowDynamicLabels}
        />
      </div>
    </CosmographProvider>
  );
}

function GradientOverlay({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      tabIndex={-1}
      className={cn(
        "w-full h-16 absolute left-0 pointer-events-none",
        position === "top"
          ? "bg-gradient-to-t from-transparent to-page to-50% top-0"
          : "bg-gradient-to-b from-transparent to-page to-50% bottom-0"
      )}
    />
  );
}

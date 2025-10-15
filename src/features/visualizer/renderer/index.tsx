import {
  Cosmograph,
  CosmographProvider,
  type CosmographRef,
} from "@cosmograph/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode } from "../types";
import { cn } from "~/lib/utils";
import GraphRendererHeader from "./header";
import GraphRendererFooter from "./footer";
import { useGraphRendererHelpers } from "./hooks/use-graph-renderer-helpers";
import { useZoomControls } from "./hooks/use-zoom-controls";
import NodeMetadata from "./node-metadata";
import { useStore } from "../hooks/use-store";
import { MODE } from "./constant";
import type { ColorMap, SizeMap } from "../algorithms/implementations";
import { observer } from "mobx-react-lite";

const INITIAL_ZOOM_LEVEL = 1;
const SIMULATION_LINK_DISTANCE = 20;
const SIMULATION_SPRING = 0.02;
const SIMULATION_DECAY = 100000;
const SIMULATION_REPULSION = 2;

const GraphRenderer = observer(({ className }: { className?: string }) => {
  const { database, gravity, nodeSizeScale, activeResponse } = useStore();

  const { nodes, edges, nodesMap, nodeTables, directed } = database.graph;

  const { sizes, colors, mode } = useMemo(() => {
    const result: { sizes: SizeMap; colors: ColorMap; mode: number } = {
      sizes: {},
      colors: {},
      mode: MODE.COLOR_SHADE_DEFAULT,
    };
    if (!!activeResponse) {
      !!activeResponse.sizeMap && (result.sizes = activeResponse.sizeMap);
      result.colors = activeResponse.colorMap;
      result.mode = activeResponse.mode;
    }
    return result;
  }, [activeResponse]);

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
    useGraphRendererHelpers({
      mode,
      colors,
      sizes,
      directed: database.graph.directed,
    });
  const { zoomToNode } = useZoomControls(cosmographRef);

  // Unpause simulation if nodes/edges changed
  useEffect(() => {
    setIsSimulationPaused(false);
  }, [nodes, edges]);

  // Start/pause simulation based on isSimulationPaused state
  useEffect(() => {
    if (isSimulationPaused) {
      cosmographRef.current?.pause();
    } else {
      cosmographRef.current?.start();
    }
  }, [isSimulationPaused]);

  // Get outgoing edges map
  const nodeOutgoingEdgesMap = useMemo(() => {
    const map: Record<string, [GraphNode, GraphEdge][]> = {};

    edges.forEach((edge) => {
      // Source → Target
      if (!map[edge.source]) map[edge.source] = [];
      const target = nodesMap.get(edge.target);
      if (!!target) map[edge.source].push([target, edge]);

      // If undirected, also add Target → Source
      if (!directed) {
        if (!map[edge.target]) map[edge.target] = [];
        const source = nodesMap.get(edge.source);
        if (!!source) map[edge.target].push([source, edge]);
      }
    });

    return map;
  }, [nodesMap, edges, directed]);

  const clickedNodeSchema = useMemo(() => {
    if (clickedNode) {
      return (
        nodeTables.find((n) => n.tableName === clickedNode.tableName) ?? null
      );
    }
    return null;
  }, [clickedNode, nodeTables]);

  const selectNode = (node: GraphNode | null | undefined) => {
    zoomToNode(node);
    setClickedNode(node ?? null);
  };

  const unselectNode = (_: GraphNode | null | undefined) => {
    cosmographRef.current?.unselectNodes();
    setClickedNode(null);
  };

  return (
    <CosmographProvider nodes={nodes} links={edges}>
      <div className={cn("flex flex-col w-full h-full relative", className)}>
        {/* Main Graph Visualizer */}
        <Cosmograph
          ref={cosmographRef}
          onClick={selectNode}
          initialZoomLevel={INITIAL_ZOOM_LEVEL}
          nodeSize={(_, id) => getNodeSize(id)}
          nodeColor={(_, id) => getNodeColor(id)}
          nodeGreyoutOpacity={0.1}
          nodeLabelAccessor={(node) => String(node._primaryKeyValue)}
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
        {!!clickedNode && !!clickedNodeSchema && (
          <NodeMetadata
            key={clickedNode.id}
            node={clickedNode}
            nodeSchema={clickedNodeSchema}
            outgoingEdges={nodeOutgoingEdgesMap[clickedNode.id] ?? []}
            directed={directed}
            onClose={() => unselectNode(clickedNode)}
          />
        )}

        {/* Top Gradient Overlay */}
        <GradientOverlay position="top" />

        {/* Visualizer Header */}
        <GraphRendererHeader onSelectNode={selectNode} />

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
});

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

export default GraphRenderer;

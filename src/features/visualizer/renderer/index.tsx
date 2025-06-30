import {
  Cosmograph,
  CosmographProvider,
  CosmographSearch,
  type CosmographRef,
} from "@cosmograph/react";
import { useCallback, useRef, useState } from "react";
import type { GraphEdge, GraphNode } from "../types";
import { MODE } from "./constant";

export default function GraphRenderer({
  nodes,
  edges,
  colors,
  mode,
  gravity,
  nodeSizeScale,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  colors: Record<string, number>; // From algorithm's response
  mode: number; // From algorithm's response
  gravity: number; // From settings sidebar
  nodeSizeScale: number; // From settings sidebar
}) {
  // Refs
  const cosmographRef = useRef<CosmographRef<GraphNode, GraphEdge> | null>(
    null
  );

  // States
  const [showDynamicLabels, setShowDynamicLabels] = useState(true);

  // Decide whether to include a "Name" accessor in Cosmograph search UI
  const allNodesHaveName = nodes.every((n) => n.name);
  const nameAccessor = allNodesHaveName
    ? [{ label: "Name", accessor: (n: GraphNode) => n.name as string }]
    : [];

  // Zoom in/out functions
  const zoomOut = useCallback(() => {
    cosmographRef.current?.unselectNodes();
    cosmographRef.current?.fitView(500);
  }, []);

  const zoomToNode = useCallback(
    (node: GraphNode | undefined, index: number | undefined) => {
      if (node && index) {
        cosmographRef.current?.selectNode(node);
        cosmographRef.current?.zoomToNode(node);
      } else {
        zoomOut();
      }
    },
    [zoomOut]
  );

  return (
    <div className="flex flex-col h-full">
      <CosmographProvider nodes={nodes} links={edges}>
        <div
          style={
            {
              // Set custom properties manually on the DOM element wrapping CosmographSearch
              "--cosmograph-search-input-background": "var(--color-page)",
              "--cosmograph-search-list-background": "var(--color-page)",
              "--cosmograph-search-text-color":
                "var(--color-typography-primary)",
              "--cosmograph-search-hover-color": "var(--color-neutral-low)",
              "--cosmograph-search-accessor-background": "var(--color-neutral)",
              "--cosmograph-search-mark-background": "var(--color-primary)",
              "--cosmograph-search-interactive-background":
                "var(--color-neutral-hover)",
            } as React.CSSProperties
          }
          className="[.cosmograph-search-result>span]:text-[var(--color-typography-primary)]"
        >
          <CosmographSearch
            onSelectResult={(n) => {
              if (!n) return;
              cosmographRef.current?.selectNode(n);
            }}
            accessors={[
              { label: "ID", accessor: (n) => n.id },
              ...nameAccessor,
            ]}
            className="p-6"
          />
        </div>
        <Cosmograph
          ref={cosmographRef}
          onClick={zoomToNode}
          initialZoomLevel={1}
          // nodeSize={(_node, id) => getSize(id)}
          // nodeColor={(_node, id) => getColor(colors[id])}
          nodeGreyoutOpacity={0.1}
          nodeLabelAccessor={(node) => (node.name ? node.name : node.id)}
          nodeSizeScale={nodeSizeScale}
          // linkColor={(link) => getLinkColor(link)}
          // linkWidth={(link) => getLinkWidth(link)}
          linkArrows={false} // TODO: Ask about directed variable
          linkGreyoutOpacity={0}
          simulationLinkDistance={20}
          simulationLinkSpring={0.02}
          simulationDecay={100000}
          simulationRepulsion={2}
          simulationGravity={gravity}
          disableSimulation={false}
          showDynamicLabels={showDynamicLabels}
          hoveredNodeRingColor={"var(--color-positive)"}
          renderHoveredNodeRing={true}
          backgroundColor="transparent"
          className="bg-page flex-1"
        />
      </CosmographProvider>
    </div>
  );
}

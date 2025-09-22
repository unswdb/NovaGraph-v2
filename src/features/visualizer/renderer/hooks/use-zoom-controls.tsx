import type { CosmographRef } from "@cosmograph/react";
import { useCallback } from "react";
import type { GraphEdge, GraphNode } from "../../types";

const ZOOM_DURATION = 500;
const SMALLEST_ZOOM_LEVEL = 0.1;

export const useZoomControls = (
  cosmographRef: React.RefObject<CosmographRef<GraphNode, GraphEdge> | null>
) => {
  const fitToScreen = useCallback(() => {
    cosmographRef.current?.unselectNodes();
    cosmographRef.current?.fitView(ZOOM_DURATION);
  }, [cosmographRef]);

  const zoomToNode = useCallback(
    (node: GraphNode | null | undefined) => {
      if (node) {
        cosmographRef.current?.selectNode(node);
        cosmographRef.current?.zoomToNode(node);
      } else {
        fitToScreen();
      }
    },
    [cosmographRef, fitToScreen]
  );

  const zoomIn = useCallback(() => {
    const zoomLevel = cosmographRef.current?.getZoomLevel();
    if (!zoomLevel) return;
    cosmographRef.current?.setZoomLevel(zoomLevel + 1, ZOOM_DURATION);
  }, [cosmographRef]);

  const zoomOut = useCallback(() => {
    const zoomLevel = cosmographRef.current?.getZoomLevel();
    if (!zoomLevel) return;
    if (zoomLevel <= 1) {
      cosmographRef.current?.setZoomLevel(SMALLEST_ZOOM_LEVEL, ZOOM_DURATION);
    } else {
      cosmographRef.current?.setZoomLevel(zoomLevel - 1, ZOOM_DURATION);
    }
  }, [cosmographRef]);

  return { fitToScreen, zoomToNode, zoomIn, zoomOut };
};

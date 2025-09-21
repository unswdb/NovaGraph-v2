import type { GraphDatabase, GraphEdge, GraphNode } from "../../types";
import { type RefObject } from "react";
import type { CosmographRef } from "@cosmograph/react";
import { useZoomControls } from "../hooks/use-zoom-controls";
import { capitalize, cn } from "~/lib/utils";
import ImportDropdown from "../../import/import-dropdown";
import GraphRendererSearch from "./search";

export type Accessor = { label: string; accessor: (n: GraphNode) => string };

export default function GraphRendererHeader({
  database,
  databases,
  setDatabase,
  addDatabase,
  cosmographRef,
  nodes,
}: {
  database: GraphDatabase | null;
  databases: GraphDatabase[];
  setDatabase: (g: GraphDatabase) => void;
  addDatabase: (g: GraphDatabase) => void;
  cosmographRef: RefObject<CosmographRef<GraphNode, GraphEdge> | null>;
  nodes: GraphNode[];
}) {
  // Hooks
  const { zoomToNode } = useZoomControls(cosmographRef);

  const accessors: Accessor[] =
    nodes.length > 0
      ? [
          { label: "ID", accessor: (n: GraphNode) => String(n.id) },
          ...(nodes[0]?.label
            ? [{ label: "Label", accessor: (n: GraphNode) => String(n.label) }]
            : []),
          ...(nodes[0]?.attributes
            ? Object.keys(nodes[0].attributes).map((attribute) => ({
                label: capitalize(attribute),
                accessor: (n: GraphNode) =>
                  String(n.attributes?.[attribute] ?? ""),
              }))
            : []),
        ]
      : [];

  return (
    <div className="flex justify-between items-center h-fit w-full absolute inset-0">
      {/* Import */}
      <div className="m-4 flex-1 flex items-center gap-2">
        <span className="whitespace-nowrap">Database:</span>
        <ImportDropdown
          database={database}
          setDatabase={setDatabase}
          databases={databases}
          addDatabase={addDatabase}
          className="flex-1 max-w-[200px]"
        />
      </div>
      <div className="flex-1 flex justify-end h-18">
        {/* Search */}
        <GraphRendererSearch
          nodes={nodes}
          accessors={accessors}
          onSelect={(n) => zoomToNode(n)}
          className="p-4 rounded-md h-max"
        />
        {/* TODO: Export */}
      </div>
    </div>
  );
}

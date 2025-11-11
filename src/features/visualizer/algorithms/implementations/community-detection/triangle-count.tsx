import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";
import { ChevronRight } from "lucide-react";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import type { TriangleCountOutputData } from "~/igraph/algorithms/Community/IgraphTriangles";

export const triangleCount = createGraphAlgorithm<TriangleCountOutputData>({
  title: "Triangle Count",
  description:
    "Counts the number of triangles (groups of 3 connected nodes) in a graph.",
  inputs: [],
  wasmFunction: async (igraphController, _) => {
    return await igraphController.triangles();
  },
  output: (props) => <TriangleCount {...props} />,
});

function TriangleCount(props: GraphAlgorithmResult<TriangleCountOutputData>) {
  const { triangles } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 40,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Triangle Count completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Triangles Found:{" "}
        <b className="text-typography-primary">{triangles.length}</b>
      </p>

      {/* Triangles */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Triangles</h3>
        <div className="max-h-80 overflow-y-auto">
          {triangles.length > 0 ? (
            <List
              rowComponent={TriangleCountRowComponent}
              rowCount={triangles.length}
              rowHeight={rowHeight}
              rowProps={{ triangles }}
            />
          ) : (
            <p className="text-critical font-medium">No triangles found</p>
          )}
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            Each entry is a{" "}
            <span className="font-medium">triangle (3-cycle)</span>, a trio of
            nodes where every pair is connected.
          </li>
          <li>
            The count (<span className="font-medium">{triangles.length}</span>)
            reflects how many such triangles exist; more triangles imply{" "}
            <span className="font-medium">higher transitivity</span> and local
            cohesion.
          </li>
          <li>
            Overlapping triangles often indicate{" "}
            <span className="font-medium">community cores</span> or tightly
            bonded subgraphs.
          </li>
        </ul>
      </div>
    </div>
  );
}

function TriangleCountRowComponent({
  index,
  style,
  triangles,
}: RowComponentProps<{
  triangles: TriangleCountOutputData["triangles"];
}>) {
  const triangle = triangles[index];
  return (
    <div key={index} style={style}>
      <Collapsible
        defaultOpen={true}
        className="border border-primary-low rounded-md mb-2 transition-colors duration-150 hover:bg-primary-low/50"
      >
        <CollapsibleTrigger className="px-3 py-1.5 w-full flex items-center justify-between">
          <p className="text-sm font-semibold">Triangle {index + 1}</p>
          <ChevronRight />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 py-2 flex flex-wrap gap-1">
          {[triangle.node1, triangle.node2, triangle.node3].map((t, i) => (
            <span
              key={`${index}-${i}-${t}`}
              className="px-3 py-1.5 rounded-md bg-primary-low"
            >
              {t}
            </span>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

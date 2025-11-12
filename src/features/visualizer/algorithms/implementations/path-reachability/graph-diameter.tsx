import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import type { GraphDiameterOutputData } from "~/igraph/algorithms/Misc/IgraphDiameter";

export const graphDiameter = createGraphAlgorithm<GraphDiameterOutputData>({
  title: "Graph Diameter",
  description: "Calculates the longest shortest path between any two nodes.",
  inputs: [],
  wasmFunction: async (igraphController, _) => {
    return await igraphController.graphDiameter();
  },
  output: (props) => <GraphDiameter {...props} />,
});

function GraphDiameter(props: GraphAlgorithmResult<GraphDiameterOutputData>) {
  const { source, target, diameter, path } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 48,
  });

  const cumulative = path.reduce<number[]>((acc, step, i) => {
    const prev = acc[i - 1] ?? 0;
    acc.push(prev + (step.weight ?? 1));
    return acc;
  }, []);

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Graph Diameter completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Source:</span>
          <span className="text-typography-primary font-medium">{source}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Target:</span>
          <span className="text-typography-primary font-medium">{target}</span>
        </div>

        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">
            Diameter/Total Weight:
          </span>
          <span className="text-typography-primary font-medium">
            {diameter ?? cumulative[path.length - 1]}
          </span>
        </div>
      </div>

      {/* Step By Step */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Step By Step</h3>
        <div className="max-h-80 overflow-y-auto">
          <List
            rowComponent={GraphDiameterPathRowComponent}
            rowCount={path.length}
            rowHeight={rowHeight}
            rowProps={{ cumulative, path }}
          />
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            The graph diameter is the length of the{" "}
            <span className="font-medium">longest shortest path</span> between
            any two nodes.
          </li>
          <li>
            The pair shown (<span className="font-medium">{source}</span> →{" "}
            <span className="font-medium">{target}</span>) achieves this
            diameter, with the listed{" "}
            <span className="font-medium">shortest-path sequence</span>.
          </li>
          <li>
            The reported value (<span className="font-medium">{diameter}</span>{" "}
            or total cumulative weight) is the{" "}
            <span className="font-medium">distance</span> of that path.
          </li>
          <li>
            Interpretation: a larger diameter suggests{" "}
            <span className="font-medium">sparser or more elongated</span>{" "}
            connectivity; a smaller one indicates a more{" "}
            <span className="font-medium">compact</span> network.
          </li>
          <li>
            In weighted graphs, diameter reflects{" "}
            <span className="font-medium">cost/delay</span>; in unweighted
            graphs, it counts <span className="font-medium">hops</span>.
          </li>
        </ul>
      </div>
    </div>
  );
}

function GraphDiameterPathRowComponent({
  index,
  style,
  cumulative,
  path: paths,
}: RowComponentProps<{
  cumulative: number[];
  path: GraphDiameterOutputData["path"];
}>) {
  const path = paths[index];
  return (
    <div key={index} style={style}>
      <div className="border border-border rounded-md px-4 py-3 space-y-1 mb-2">
        <div className="grid grid-cols-[36px_1fr_auto] gap-4">
          {/* Step number */}
          <p className="text-sm font-semibold">{index + 1}</p>

          {/* Source to Target */}
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 h-full">
              <span className="max-w-1/2 px-3 py-1.5 rounded-md bg-primary-low text-sm truncate whitespace-nowrap">
                {path.from}
              </span>
              <span className="shrink-0">→</span>
              <span className="max-w-1/2 px-3 py-1.5 rounded-md bg-primary-low text-sm truncate whitespace-nowrap">
                {path.to}
              </span>
            </div>
          </div>

          {/* Weight */}
          <div className="text-right">
            <p className="font-semibold">+{path.weight ?? 1}</p>
            <p className="text-xs text-typography-secondary">Step weight</p>
          </div>
        </div>

        {/* Cumulative */}
        <p className="text-xs text-typography-secondary">
          Cumulative: {cumulative[index - 1] ?? 0} + {path.weight ?? 1} ={" "}
          <b>{cumulative[index]}</b>
        </p>
      </div>
    </div>
  );
}

import { Grid, type CellComponentProps } from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import type { JaccardSimilarityOutputData } from "~/igraph/algorithms/Misc/IgraphJaccardSimilarity";

export const jaccardSimilarity =
  createGraphAlgorithm<JaccardSimilarityOutputData>({
    title: "Jaccard Similarity",
    description:
      "Measures the similarity between two sets of nodes. Enter at least 2 nodes to compare.",
    inputs: [
      createAlgorithmSelectInput({
        id: "jaccard-nodes",
        key: "nodes",
        displayName: "Nodes",
        source: "nodes",
        multiple: true,
        required: true,
        validator: (value) => {
          if (value.length > 1) {
            return { success: true };
          } else {
            return {
              success: false,
              message: "Enter at least 2 nodes to compare.",
            };
          }
        },
      }),
    ],
    wasmFunction: async (controller, [nodeIds]) => {
      const algorithm = controller.getAlgorithm();
      if (algorithm === undefined) {
        throw new Error("Algorithm controller not initialized");
      }
      const result = await algorithm.jaccardSimilarity(nodeIds);
      return {
        ...result,
        type: "algorithm",
      };
    },
    output: (props) => <Jaccard {...props} />,
  });

function Jaccard(props: GraphAlgorithmResult<JaccardSimilarityOutputData>) {
  const { nodes, similarityMatrix, maxSimilarity } = props.data;
  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Jaccard Similarity completed successfully
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Source:</span>
          <span className="text-typography-primary font-medium">
            {maxSimilarity.node1}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-typography-secondary">Target:</span>
          <span className="text-typography-primary font-medium">
            {maxSimilarity.node2}
          </span>
        </div>
        <div className="flex justify-between gap-2 col-span-2">
          <span className="text-typography-secondary">Max Similarity:</span>
          <span className="text-typography-primary font-medium">
            {maxSimilarity.similarity}
          </span>
        </div>
      </div>

      {/* Similarity Matrix */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Similarity Matrix</h3>
        <div className="max-h-80 overflow-auto">
          <Grid
            cellComponent={JaccardSimilarityCellComponent}
            columnCount={nodes.length + 1} // for left header col
            rowCount={nodes.length + 1} // for top header row
            rowHeight={32}
            columnWidth={150}
            cellProps={{ nodes, similarityMatrix }}
          />
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            Jaccard similarity measures how similar two nodes’ neighborhoods
            are:
            <span className="font-medium"> |N(u) ∩ N(v)| / |N(u) ∪ N(v)|</span>.
            (Here, <span className="font-medium">N(x)</span> is the set of
            neighbors)
          </li>
          <li>
            It’s useful for <span className="font-medium">link prediction</span>
            , <span className="font-medium">community detection</span>, and{" "}
            <span className="font-medium">recommendation</span>, indicating how
            much context two nodes share.
          </li>
          <li>
            We computed pairwise similarities for{" "}
            <span className="font-medium">{nodes.length}</span> nodes. The
            highest-scoring pair is{" "}
            <span className="font-medium">{maxSimilarity.node1}</span> ↔{" "}
            <span className="font-medium">{maxSimilarity.node2}</span> with{" "}
            <span className="font-medium">
              {maxSimilarity.similarity.toFixed(2)}
            </span>
            .
          </li>
          <li>
            The matrix is <span className="font-medium">symmetric</span>; larger
            values (closer to 1.00) mean stronger neighborhood overlap. Diagonal
            cells compare a node with itself and are typically{" "}
            <span className="font-medium">1.00</span>.
          </li>
          <li>
            Interpretation: <span className="font-medium">1.00</span> ⇒
            identical neighbor sets; <span className="font-medium">0.00</span> ⇒
            no shared neighbors. Very high-degree pairs may score lower even if
            they share many neighbors (ratio effect).
          </li>
        </ul>
      </div>
    </div>
  );
}

function JaccardSimilarityCellComponent({
  columnIndex,
  rowIndex,
  style,
  nodes,
  similarityMatrix,
}: CellComponentProps<{
  nodes: JaccardSimilarityOutputData["nodes"];
  similarityMatrix: JaccardSimilarityOutputData["similarityMatrix"];
}>) {
  // Top-left corner
  if (rowIndex === 0 && columnIndex === 0) {
    return (
      <div style={style} className="bg-neutral-low border border-border" />
    );
  }

  // Top header row
  if (rowIndex === 0) {
    return (
      <div
        key={`${columnIndex}-${rowIndex}`}
        style={style}
        className="bg-neutral-low border border-border flex items-center justify-center text-xs font-semibold"
      >
        <span>{nodes[columnIndex - 1]}</span>
      </div>
    );
  }

  // Left header col
  if (columnIndex === 0) {
    return (
      <div
        key={`${columnIndex}-${rowIndex}`}
        style={style}
        className="bg-neutral-low border border-border flex items-center justify-center text-xs font-semibold"
      >
        <span>{nodes[rowIndex - 1]}</span>
      </div>
    );
  }

  // Body cell: offset indices by -1 into the matrix
  const r = rowIndex - 1;
  const c = columnIndex - 1;
  const v = similarityMatrix[r][c];

  const isDiagonal = r === c;

  return (
    <div
      style={style}
      className="border border-border flex items-center justify-center text-xs"
      title={`${nodes[r]} ↔ ${nodes[c]} = ${v.toFixed(2)}`}
    >
      <span className={isDiagonal ? "font-semibold text-primary" : ""}>
        {v.toFixed(2)}
      </span>
    </div>
  );
}

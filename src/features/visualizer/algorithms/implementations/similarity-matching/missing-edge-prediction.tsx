import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import type { MissingEdgePredictionOutputData } from "~/igraph/algorithms/Misc/IgraphMissingEdgePrediction";
import { createNumberInput } from "~/features/visualizer/inputs";

export const missingEdgePrediction =
  createGraphAlgorithm<MissingEdgePredictionOutputData>({
    title: "Missing Edge Prediction",
    description:
      "Fits a Hierarchical Random Graph (HRG) model to the graph and predicts missing edges based on the model.",
    inputs: [
      createNumberInput({
        id: "missing-edge-prediction-sample-size",
        key: "sample_size",
        displayName: "Sample Size (Accuracy)",
        defaultValue: 2,
        min: 1,
        step: 1,
        required: true,
      }),
      createNumberInput({
        id: "missing-edge-prediction-bins",
        key: "num_of_bins",
        displayName: "Number of Bins (Precision)",
        defaultValue: 10,
        min: 1,
        step: 1,
        required: true,
      }),
    ],
    wasmFunction: async (igraphController, [arg1, arg2]) => {
      return await igraphController.missingEdgePrediction(arg1, arg2);
    },
    output: (props) => <MissingEdgePrediction {...props} />,
  });

function MissingEdgePrediction(
  props: GraphAlgorithmResult<MissingEdgePredictionOutputData>
) {
  const { predictedEdges } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 36,
  });

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Missing Edge Prediction completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Missing Edge Found:{" "}
        <b className="text-typography-primary">{predictedEdges.length}</b>
      </p>

      {/* Predicted Edges */}
      <div className="space-y-3 border-t border-t-border pt-3 isolate">
        <h3 className="font-semibold">Predicted Edges</h3>
        <div className="max-h-80 overflow-y-auto">
          {predictedEdges.length > 0 ? (
            <div className="border border-border rounded-md">
              <List
                rowComponent={MissingEdgePredictionRowComponent}
                rowCount={predictedEdges.length + 1} // Top header row
                rowHeight={rowHeight}
                rowProps={{ predictedEdges }}
              />
            </div>
          ) : (
            <p className="text-critical font-medium">
              No edges can be predicted
            </p>
          )}
        </div>
      </div>

      {/* What this means */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">What this means</h3>
        <ul className="text-typography-secondary text-sm list-disc list-inside space-y-1">
          <li>
            This fits a{" "}
            <span className="font-medium">Hierarchical Random Graph (HRG)</span>{" "}
            model to the graph and estimates which pairs of nodes are most
            likely to have a <span className="font-medium">missing edge</span>.
          </li>
          <li>
            Each suggested edge <span className="font-medium">from → to</span>{" "}
            comes with a probability (e.g., <i>73.200%</i>) that reflects how
            well that edge would fit the learned hierarchical community
            structure.
          </li>
          <li>
            Higher probabilities indicate{" "}
            <span className="font-medium">stronger model support</span> for the
            edge existing, but they are{" "}
            <span className="font-medium">not guarantees</span>, treat them as
            ranked hypotheses to verify.
          </li>
          <li>
            The predictions are influenced by{" "}
            <span className="font-medium">community/group structure</span>{" "}
            captured by the HRG; nodes placed close together in the hierarchy
            are more likely to connect.
          </li>
          <li>
            Parameter: <span className="font-medium">Sample Size</span> controls
            accuracy by drawing more HRG samples (more stable estimates,
            slower). <span className="font-medium">Number of Bins</span>{" "}
            controls probability precision (finer bins = more granular
            probabilities).
          </li>
          <li>
            Practical use: prioritize reviewing/validating the top-scoring pairs
            (e.g., domain knowledge, data audits, experiments) and consider
            adding them as candidate edges in downstream analyses.
          </li>
        </ul>
      </div>
    </div>
  );
}

function MissingEdgePredictionRowComponent({
  index,
  style,
  predictedEdges,
}: RowComponentProps<{
  predictedEdges: MissingEdgePredictionOutputData["predictedEdges"];
}>) {
  // Top header row
  if (index === 0) {
    return (
      <div key={index} className="grid grid-cols-4 bg-tabdock" style={style}>
        <span className="font-semibold text-sm px-3 py-1.5">No.</span>
        <span className="font-semibold text-sm px-3 py-1.5">Source</span>
        <span className="font-semibold text-sm px-3 py-1.5">Target</span>
        <span className="font-semibold text-sm px-3 py-1.5">Probability</span>
      </div>
    );
  }

  const predictedEdge = predictedEdges[index - 1];
  return (
    <div
      key={index}
      className="grid grid-cols-4 not-odd:bg-neutral-low/50"
      style={style}
    >
      <span className="px-3 py-1.5 truncate">{index}</span>
      <span className="px-3 py-1.5 truncate">{predictedEdge.from}</span>
      <span className="px-3 py-1.5 truncate">{predictedEdge.to}</span>
      <span className="px-3 py-1.5 truncate">{predictedEdge.probability}</span>
    </div>
  );
}

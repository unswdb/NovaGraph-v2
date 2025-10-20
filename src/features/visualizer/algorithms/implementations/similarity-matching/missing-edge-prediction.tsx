import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

import { createNumberInput } from "~/features/visualizer/inputs";
import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

// Infered from src/wasm/algorithms
type MissingEdgePredictionOutputData = {
  predictedEdges: Array<{
    from: string; // name(src)
    to: string; // name(tar)
    probability: string; // e.g. "73.200%" (3 dp string)
  }>;
};

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
    wasmFunction: (module, [arg1, arg2]) => {
      if (module) return module.missing_edge_prediction(arg1, arg2);
    },
    output: (props) => <MissingEdgePrediction {...props} />,
  });

function MissingEdgePrediction(
  props: GraphAlgorithmResult<MissingEdgePredictionOutputData>
) {
  const { predictedEdges } = props.data;

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 50,
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
        <div className="border border-border border-collapse rounded-md overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-4 bg-tabdock">
            <span className="font-semibold text-sm px-3 py-1.5">No.</span>
            <span className="font-semibold text-sm px-3 py-1.5">Source</span>
            <span className="font-semibold text-sm px-3 py-1.5">Target</span>
            <span className="font-semibold text-sm px-3 py-1.5">
              Probability
            </span>
          </div>
          {/* Rows */}
          <div className="max-h-80 overflow-y-auto">
            <List
              rowComponent={MissingEdgePredictionRowComponent}
              rowCount={predictedEdges.length}
              rowHeight={rowHeight}
              rowProps={{ predictedEdges }}
            />
          </div>
        </div>
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
  const predictedEdge = predictedEdges[index];
  return (
    <div
      key={index}
      className="grid grid-cols-4 not-odd:bg-neutral-low/50"
      style={style}
    >
      <span className="px-3 py-1.5 truncate">{index + 1}</span>
      <span className="px-3 py-1.5 truncate">{predictedEdge.from}</span>
      <span className="px-3 py-1.5 truncate">{predictedEdge.to}</span>
      <span className="px-3 py-1.5 truncate">{predictedEdge.probability}</span>
    </div>
  );
}

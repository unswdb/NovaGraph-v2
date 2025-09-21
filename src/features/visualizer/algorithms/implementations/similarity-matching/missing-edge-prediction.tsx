import { createNumberInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

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
        label: "Sample Size (Accuracy)",
        defaultValue: 2,
        min: 1,
        step: 1,
        required: true,
      }),
      createNumberInput({
        id: "missing-edge-prediction-bins",
        label: "Number of Bins (Precision)",
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
  return (
    <p>Missing Edge Prediction output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

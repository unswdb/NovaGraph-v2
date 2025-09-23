import { createAlgorithmSelectInput } from "~/features/visualizer/inputs";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type JaccardSimilarityOutputData = {
  nodes: string[]; // names of queried nodes, input order
  similarityMatrix: number[][]; // 2 dp numbers
  maxSimilarity: {
    node1: string;
    node2: string;
    similarity: number; // also 2 dp
  };
};

export const jaccardSimilarity =
  createGraphAlgorithm<JaccardSimilarityOutputData>({
    title: "Jaccard Similarity",
    description:
      "Measures the similarity between two sets of nodes. Enter at least 2 nodes to compare.",
    inputs: [
      createAlgorithmSelectInput({
        id: "jaccard-nodes",
        label: "Nodes",
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
    wasmFunction: (module, [args]) => {
      if (module) return module.jaccard_similarity(args);
    },
    output: (props) => <Jaccard {...props} />,
  });

function Jaccard(props: GraphAlgorithmResult<JaccardSimilarityOutputData>) {
  const { nodes, similarityMatrix, maxSimilarity } = props.data;
  return (
    <p>Jaccard Similarity output: {JSON.stringify(props.data, null, 2)}</p>
  );
}

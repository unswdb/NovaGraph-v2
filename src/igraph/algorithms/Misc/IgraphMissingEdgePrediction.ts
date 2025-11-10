import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type MissingEdgePredictionOutputData<T = string> = {
  algorithm: string;
  predictedEdges: Array<{
    from: T; // name(src)
    to: T; // name(tar)
    probability: string; // e.g. "73.200%" (3 dp string)
  }>;
};

export type MissingEdgePredictionResult<T = string> =
  BaseGraphAlgorithmResult & {
    data: MissingEdgePredictionOutputData<T>;
  };

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: MissingEdgePredictionResult<number>
): MissingEdgePredictionResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  const predictedEdges = data.predictedEdges.map(
    ({ from, to, probability }) => ({
      from: mapLabelBack(from),
      to: mapLabelBack(to),
      probability,
    })
  );

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      predictedEdges,
    },
  };
}

export async function igraphMissingEdgePrediction(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  sampleSize: number,
  numBins: number
): Promise<MissingEdgePredictionResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.missing_edge_prediction(sampleSize, numBins)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

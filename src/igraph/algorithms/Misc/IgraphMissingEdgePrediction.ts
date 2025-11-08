import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type MissingEdgePredictionOutputData = {
  predictedEdges: Array<{
    from: string; // name(src)
    to: string; // name(tar)
    probability: string; // e.g. "73.200%" (3 dp string)
  }>;
};

export type MissingEdgePredictionResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: MissingEdgePredictionOutputData;
};

async function _runIgraphAlgo(
  igraphMod: any,
  numSamples: number,
  numBins: number
): Promise<any> {
  try {
    return await igraphMod.missing_edge_prediction(numSamples, numBins);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): MissingEdgePredictionResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      predictedEdges: data.predictedEdges,
    },
  };
}

export async function igraphMissingEdgePrediction(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  sampleSize: number,
  numBins: number
): Promise<MissingEdgePredictionResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, sampleSize, numBins);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

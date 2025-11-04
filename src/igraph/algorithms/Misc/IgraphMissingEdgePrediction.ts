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
    throw new Error("internal missing edge prediction error: " + e);
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): MissingEdgePredictionResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  const predictedEdges = (data.predictedEdges ?? []).map(
    ({ from, to, probability }: any) => ({
      // from and to are already Kuzu names from igraph_get_name, but we map them
      // to ensure consistency (mapIdBack handles both strings and numbers)
      from: mapIdBack(from),
      to: mapIdBack(to),
      probability,
    })
  );

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      predictedEdges,
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


import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type LocalClusteringCoefficientOutputData = {
  global_coefficient: number; // 4 dp, avg-ignore-zeros
  coefficients: {
    id: number; // vertex id
    node: string; // vertex name
    value: number; // 4 dp (can be NaN when undefined)
  }[];
};

export type LocalClusteringCoefficientResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: LocalClusteringCoefficientOutputData;
};

// TODO: more comprehensive testing
async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.local_clustering_coefficient();
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): LocalClusteringCoefficientResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      global_coefficient: data.global_coefficient ?? 0,
      coefficients: data.coefficients,
    },
  };
}

export async function igraphLocalClusteringCoefficient(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<LocalClusteringCoefficientResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

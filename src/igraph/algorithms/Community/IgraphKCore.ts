import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type KCoreOutputData = {
  k: number;
  max_coreness: number; // max over all vertices
  cores: {
    id: number; // vertex id (original graph)
    node: string; // vertex name
  }[];
};

export type KCoreResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: KCoreOutputData;
};

async function _runIgraphAlgo(igraphMod: any, k: number): Promise<any> {
  try {
    return await igraphMod.k_core(k);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): KCoreResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      k: data.k ?? 0,
      max_coreness: data.max_coreness ?? 0,
      cores: data.cores,
    },
  };
}

export async function igraphKCore(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  k: number
): Promise<KCoreResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, k);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

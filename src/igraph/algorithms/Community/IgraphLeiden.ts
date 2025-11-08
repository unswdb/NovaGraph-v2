import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type LeidenOutputData = {
  modularity: number;
  quality: number;
  communities: string[][]; // index = community id, value = node-name[]
};

export type LeidenResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: LeidenOutputData;
};

// TODO: more comprehensive testing
async function _runIgraphAlgo(
  igraphMod: any,
  resolution: number
): Promise<any> {
  try {
    return await igraphMod.leiden(resolution);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): LeidenResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      modularity: data.modularity ?? 0,
      quality: data.quality ?? 0,
      communities: data.communities,
    },
  };
}

export async function igraphLeiden(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  resolution: number
): Promise<LeidenResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, resolution);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

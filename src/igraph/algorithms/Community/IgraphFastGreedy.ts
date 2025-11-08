import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type FastGreedyOutputData = {
  modularity: number;
  communities: string[][]; // index = community id, value = node-name[]
};

export type FastGreedyResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: FastGreedyOutputData;
};

// TODO: more comprehensive testing
async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.fast_greedy();
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): FastGreedyResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      modularity: data.modularity ?? 0,
      communities: data.communities,
    },
  };
}

export async function igraphFastGreedy(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<FastGreedyResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

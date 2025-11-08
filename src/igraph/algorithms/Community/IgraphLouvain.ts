import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type LouvainOutputData = {
  modularity: number;
  communities: string[][]; // index = community id, value = node-name[]
};

export type LouvainResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: LouvainOutputData;
};

// TODO: more comprehensive testing
async function _runIgraphAlgo(
  igraphMod: any,
  resolution: number
): Promise<any> {
  try {
    return await igraphMod.louvain(resolution);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): LouvainResult {
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

export async function igraphLouvain(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  resolution: number
): Promise<LouvainResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, resolution);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

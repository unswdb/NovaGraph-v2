import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";
import type { CentralityItem } from "~/features/visualizer/algorithms/implementations/centrality/types";

export type StrengthCentralityOutputData = {
  algorithm: string;
  centralities: CentralityItem[];
};

export type StrengthCentralityResult = {
  colorMap: Record<string, number>;
  sizeMap: Record<string, number>;
  mode: number;
  data: StrengthCentralityOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  return await igraphMod.strength_centrality();
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): StrengthCentralityResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Node Strength",
      centralities: data.centralities ?? [],
    },
  };
}

export async function igraphStrengthCentrality(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<StrengthCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}




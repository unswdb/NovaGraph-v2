import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";
import type { CentralityItem } from "~/features/visualizer/algorithms/implementations/centrality/types";

export type BetweennessCentralityOutputData = {
  algorithm: string;
  centralities: CentralityItem[];
};

export type BetweennessCentralityResult = {
  colorMap: Record<string, number>;
  sizeMap: Record<string, number>;
  mode: number;
  data: BetweennessCentralityOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  return await igraphMod.betweenness_centrality();
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): BetweennessCentralityResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Betweenness Centrality",
      centralities: data.centralities ?? [],
    },
  };
}

export async function igraphBetweennessCentrality(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<BetweennessCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}



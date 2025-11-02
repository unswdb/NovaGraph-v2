import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";
import type { CentralityItem } from "~/features/visualizer/algorithms/implementations/centrality/types";

export type PageRankOutputData = {
  algorithm: string;
  damping: string;
  centralities: CentralityItem[];
};

export type PageRankResult = {
  colorMap: Record<string, number>;
  sizeMap: Record<string, number>;
  mode: number;
  data: PageRankOutputData;
};

async function _runIgraphAlgo(igraphMod: any, damping: number): Promise<any> {
  try {
    return await igraphMod.pagerank(damping);
  } catch (e) {
    throw new Error("internal page rank error: " + e);
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): PageRankResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "PageRank",
      damping: data.damping ?? "0.85",
      centralities: data.centralities ?? [],
    },
  };
}

export async function igraphPageRank(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  damping: number
): Promise<PageRankResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, damping);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}



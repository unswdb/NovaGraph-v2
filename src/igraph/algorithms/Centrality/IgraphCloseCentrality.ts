import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";
import type { CentralityItem } from "~/features/visualizer/algorithms/implementations/centrality/types";

export type ClosenessCentralityOutputData = {
  algorithm: string;
  centralities: CentralityItem[];
};

export type ClosenessCentralityResult = {
  colorMap: Record<string, number>;
  sizeMap: Record<string, number>;
  mode: number;
  data: ClosenessCentralityOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  return await igraphMod.closeness_centrality();
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): ClosenessCentralityResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Closeness Centrality",
      centralities: data.centralities ?? [],
    },
  };
}

export async function igraphClosenessCentrality(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<ClosenessCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}



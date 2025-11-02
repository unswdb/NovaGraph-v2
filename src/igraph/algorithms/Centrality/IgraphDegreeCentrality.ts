import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";
import type { CentralityItem } from "~/features/visualizer/algorithms/implementations/centrality/types";

export type DegreeCentralityOutputData = {
  algorithm: string;
  centralities: CentralityItem[];
};

export type DegreeCentralityResult = {
  colorMap: Record<string, number>;
  sizeMap: Record<string, number>;
  mode: number;
  data: DegreeCentralityOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  return await igraphMod.degree_centrality();
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): DegreeCentralityResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Degree Centrality",
      centralities: data.centralities ?? [],
    },
  };
}

export async function igraphDegreeCentrality(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<DegreeCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}




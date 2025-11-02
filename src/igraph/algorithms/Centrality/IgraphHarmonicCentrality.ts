import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";
import type { CentralityItem } from "~/features/visualizer/algorithms/implementations/centrality/types";

export type HarmonicCentralityOutputData = {
  algorithm: string;
  centralities: CentralityItem[];
};

export type HarmonicCentralityResult = {
  colorMap: Record<string, number>;
  sizeMap: Record<string, number>;
  mode: number;
  data: HarmonicCentralityOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  return await igraphMod.harmonic_centrality();
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): HarmonicCentralityResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Harmonic Centrality",
      centralities: data.centralities ?? [],
    },
  };
}

export async function igraphHarmonicCentrality(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<HarmonicCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}



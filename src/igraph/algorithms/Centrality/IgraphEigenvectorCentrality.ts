import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";
import type { CentralityItem } from "~/features/visualizer/algorithms/implementations/centrality/types";

export type EigenvectorCentralityOutputData = {
  algorithm: string;
  eigenvalue: number;
  centralities: CentralityItem[];
};

export type EigenvectorCentralityResult = {
  colorMap: Record<string, number>;
  sizeMap: Record<string, number>;
  mode: number;
  data: EigenvectorCentralityOutputData;
};

// Todo: investigate more about this algorithm and how does it work
async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.eigenvector_centrality(); 
  } catch (e) {
    throw new Error ("internal eigenvector centrality error: " + e);
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): EigenvectorCentralityResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Eigenvector Centrality",
      eigenvalue: data.eigenvalue ?? 0,
      centralities: data.centralities ?? [],
    },
  };
}

export async function igraphEigenvectorCentrality(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<EigenvectorCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}



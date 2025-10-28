import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

// Inferred from src/wasm/algorithms/path-finding.cpp (bf_source_to_target)
export type BellmanFordAToBOutputData = {
  algorithm: string;
  source: string;
  target: string;
  weighted: boolean;
  path: { from: string; to: string; weight?: number }[];
  totalWeight?: number;
};

export type BellmanFordAToBResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: BellmanFordAToBOutputData;
};

async function _runIgraphAlgo(
  igraphMod: any,
  igraphStart: number,
  igraphEnd: number
): Promise<any> {
  return await igraphMod.bellman_ford_source_to_target(igraphStart, igraphEnd);
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): BellmanFordAToBResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  const path = (data.path ?? []).map(({ from, to, weight }: any) => ({
    from: mapIdBack(from),
    to: mapIdBack(to),
    weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Bellman-Ford Single Path",
      source: mapIdBack(data.source),
      target: mapIdBack(data.target),
      weighted: data.weighted,
      path,
      totalWeight: data.totalWeight,
    },
  };
}

export async function igraphBellmanFordAToB(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string,
  kuzuTargetID: string
): Promise<BellmanFordAToBResult> {
  const startIgraphId = graphData.KuzuToIgraphMap.get(kuzuSourceID);
  const endIgraphId = graphData.KuzuToIgraphMap.get(kuzuTargetID);

  if (startIgraphId === undefined || endIgraphId === undefined) {
    const weighted =
      Array.isArray(graphData.IgraphInput?.weight) &&
      graphData.IgraphInput.weight.length > 0;

    const colorMapOut: Record<string, number> = {};
    colorMapOut[String(kuzuSourceID)] = 1;
    colorMapOut[String(kuzuTargetID)] = 1;

    return {
      mode: 2,
      colorMap: colorMapOut,
      data: {
        algorithm: "Bellman-Ford Single Path",
        source: String(kuzuSourceID),
        target: String(kuzuTargetID),
        weighted,
        path: [],
      },
    };
  }

  const wasmResult = await _runIgraphAlgo(
    igraphMod,
    startIgraphId,
    endIgraphId
  );
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}



import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

// Infered from src/wasm/algorithms/path-finding.cpp
export type MinimalSpanningTreeOutputData = {
  algorithm: string;
  weighted: boolean;
  maxEdges: number; // ecount of original graph
  totalWeight?: number; // only if weighted (sum over MST edges)
  edges: {
    num: number; // 1-based order in returned MST list
    from: string;
    to: string;
    weight?: number;
  }[];
};

export type MSTResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: MinimalSpanningTreeOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  return await igraphMod.min_spanning_tree();
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): MSTResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  const edges = (data.edges ?? []).map(({ num, from, to, weight }: any) => ({
    num,
    from: mapIdBack(from),
    to: mapIdBack(to),
    weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Minimum Spanning Tree",
      weighted: data.weighted ?? false,
      maxEdges: data.maxEdges ?? 0,
      totalWeight: data.totalWeight,
      edges,
    },
  };
}

export async function igraphMST(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<MSTResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}


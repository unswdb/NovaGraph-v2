import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type TopologicalSortOutputData = {
  algorithm: string;
  order: {
    id: string; // Kuzu vertex id
    node: string; // vertex name
  }[]; // in topological order
};

export type TopologicalSortResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: TopologicalSortOutputData;
};

// Todo: more comprehensive testing
async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.topological_sort();
  } catch (e) {
    throw new Error("internal topological sort error: " + e);
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): TopologicalSortResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Topological Sort",
      order: (data.order ?? []).map((item: any) => ({
        id: mapIdBack(item.id),
        node: item.node ?? "",
      })),
    },
  };
}

export async function igraphTopologicalSort(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<TopologicalSortResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}


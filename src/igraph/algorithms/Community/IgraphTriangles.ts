import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type TriangleCountOutputData = {
  triangles: {
    id: number; // 1-based triangle id
    node1: string;
    node2: string;
    node3: string;
  }[];
};

export type TriangleCountResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: TriangleCountOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.triangle_count();
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): TriangleCountResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      triangles: data.triangles,
    },
  };
}

export async function igraphTriangles(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<TriangleCountResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

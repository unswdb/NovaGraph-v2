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
    throw new Error("internal triangle count error: " + e);
  }
}

function _parseTriangles(
  triangles: any,
  mapIdBack: (id: string | number) => string
): TriangleCountOutputData["triangles"] {
  if (!triangles) {
    return [];
  }

  // The WASM returns triangles as an object/array where each entry is a triangle object
  // with node1, node2, node3 (as strings from igraph_get_name) and id
  const result: TriangleCountOutputData["triangles"] = [];

  // Get all keys and iterate
  const keys = Object.keys(triangles).map(Number).sort((a, b) => a - b);

  for (const key of keys) {
    const triangle = triangles[key];
    if (triangle && typeof triangle === "object") {
      // The node names from WASM should already be strings, but we map them back
      // to ensure they're correct Kuzu node names in case they're igraph IDs
      const node1 = typeof triangle.node1 === "string" 
        ? triangle.node1 
        : mapIdBack(triangle.node1);
      const node2 = typeof triangle.node2 === "string" 
        ? triangle.node2 
        : mapIdBack(triangle.node2);
      const node3 = typeof triangle.node3 === "string" 
        ? triangle.node3 
        : mapIdBack(triangle.node3);

      result.push({
        id: triangle.id ?? key + 1,
        node1,
        node2,
        node3,
      });
    }
  }

  return result;
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
      triangles: _parseTriangles(data.triangles, mapIdBack),
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


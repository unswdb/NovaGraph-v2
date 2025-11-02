import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type KCoreOutputData = {
  k: number;
  max_coreness: number; // max over all vertices
  cores: {
    id: number; // vertex id (original graph)
    node: string; // vertex name
  }[];
};

export type KCoreResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: KCoreOutputData;
};

async function _runIgraphAlgo(igraphMod: any, k: number): Promise<any> {
  try {
    return await igraphMod.k_core(k);
  } catch (e) {
    throw new Error("internal k-core error: " + e);
  }
}

function _parseCores(
  cores: any,
  mapIdBack: (id: string | number) => string
): KCoreOutputData["cores"] {
  if (!cores) {
    return [];
  }

  // The WASM returns cores as an object/map where keys are igraph vertex IDs
  // and values are objects with id and node properties.
  const result: KCoreOutputData["cores"] = [];

  // Get all keys and iterate
  const keys = Object.keys(cores).map(Number).sort((a, b) => a - b);

  for (const key of keys) {
    const coreNode = cores[key];
    if (coreNode && typeof coreNode === "object") {
      // Use the id from coreNode if available, otherwise use the key
      const igraphId = typeof coreNode.id === "number" ? coreNode.id : key;
      const kuzuId = mapIdBack(igraphId);
      
      result.push({
        id: Number(kuzuId) || igraphId,
        // The node name from WASM should already be a string (node name)
        node: typeof coreNode.node === "string" 
          ? coreNode.node 
          : String(kuzuId),
      });
    }
  }

  return result;
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): KCoreResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      k: data.k ?? 0,
      max_coreness: data.max_coreness ?? 0,
      cores: _parseCores(data.cores, mapIdBack),
    },
  };
}

export async function igraphKCore(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  k: number
): Promise<KCoreResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, k);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}


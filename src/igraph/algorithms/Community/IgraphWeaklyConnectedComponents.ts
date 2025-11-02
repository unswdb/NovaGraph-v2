import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type WCCOutputData = {
  components: string[][]; // index = component id, value = node-name[]
};

export type WCCResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: WCCOutputData;
};

// TODO: debug this
async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.weakly_connected_components();
  } catch (e) {
    throw new Error("internal weakly connected components error: " + e);
  }
}

function _parseComponents(
  components: any,
  mapIdBack: (id: string | number) => string
): string[][] {
  if (!components) {
    return [];
  }

  // The WASM returns components as an object/array where keys are component IDs
  // and values are arrays of node names (strings). We need to convert this to
  // a simple array of arrays where each sub-array contains node names.
  const result: string[][] = [];
  
  // Get all keys and sort them to maintain order
  const keys = Object.keys(components).map(Number).sort((a, b) => a - b);
  
  for (const key of keys) {
    const componentArray = components[key];
    if (Array.isArray(componentArray)) {
      // Map node names if needed (though they should already be strings from WASM)
      const mappedNodes = componentArray.map((node: any) => {
        // If the node is a number (igraph ID), map it back to Kuzu ID
        // Otherwise, it should already be a string (node name)
        if (typeof node === "number") {
          return mapIdBack(node);
        }
        return String(node);
      });
      result.push(mappedNodes);
    }
  }
  
  return result;
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): WCCResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      components: _parseComponents(data.components, mapIdBack),
    },
  };
}

export async function igraphWeaklyConnectedComponents(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<WCCResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}


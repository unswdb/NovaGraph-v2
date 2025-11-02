import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type LabelPropagationOutputData = {
  communities: string[][]; // index = community id, value = node-name[]
};

export type LabelPropagationResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: LabelPropagationOutputData;
};

// TODO: more comprehensive testing
async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.label_propagation();
  } catch (e) {
    throw new Error("internal label propagation error: " + e);
  }
}

function _parseCommunities(
  communities: any,
  mapIdBack: (id: string | number) => string
): string[][] {
  if (!communities) {
    return [];
  }

  // The WASM returns communities as an object/array where keys are community IDs
  // and values are arrays of node names (strings). We need to convert this to
  // a simple array of arrays where each sub-array contains node names.
  const result: string[][] = [];
  
  // Get all keys and sort them to maintain order
  const keys = Object.keys(communities).map(Number).sort((a, b) => a - b);
  
  for (const key of keys) {
    const communityArray = communities[key];
    if (Array.isArray(communityArray)) {
      // Map node names if needed (though they should already be strings from WASM)
      const mappedNodes = communityArray.map((node: any) => {
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
): LabelPropagationResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      communities: _parseCommunities(data.communities, mapIdBack),
    },
  };
}

export async function igraphLabelPropagation(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<LabelPropagationResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}


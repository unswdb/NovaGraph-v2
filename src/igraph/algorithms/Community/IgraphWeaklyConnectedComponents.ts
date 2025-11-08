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
    throw new Error(igraphMod.what_to_stderr(e));
  }
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
      components: data.components,
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

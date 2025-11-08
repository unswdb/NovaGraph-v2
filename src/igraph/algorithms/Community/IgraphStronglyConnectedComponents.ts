import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type SCCOutputData = {
  components: string[][]; // index = component id, value = node-name[]
};

export type SCCResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: SCCOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.strongly_connected_components();
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): SCCResult {
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

export async function igraphStronglyConnectedComponents(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<SCCResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

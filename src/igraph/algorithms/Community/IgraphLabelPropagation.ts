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
    throw new Error(igraphMod.what_to_stderr(e));
  }
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
      communities: data.communities,
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

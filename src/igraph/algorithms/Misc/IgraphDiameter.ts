import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type GraphDiameterOutputData = {
  source: string;
  target: string;
  weighted: boolean;
  diameter: number;
  path: {
    from: string;
    to: string;
    weight?: number; // per-edge, only if weighted
  }[];
};

export type GraphDiameterResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: GraphDiameterOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.diameter();
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): GraphDiameterResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      source: data.source,
      target: data.target,
      weighted: data.weighted ?? false,
      diameter: data.diameter ?? 0,
      path: data.path,
    },
  };
}

export async function igraphDiameter(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<GraphDiameterResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

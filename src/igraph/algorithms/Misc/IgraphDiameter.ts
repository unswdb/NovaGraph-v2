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
    throw new Error("internal diameter error: " + e);
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): GraphDiameterResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  const path = (data.path ?? []).map(({ from, to, weight }: any) => ({
    from: mapIdBack(from),
    to: mapIdBack(to),
    weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      source: mapIdBack(data.source),
      target: mapIdBack(data.target),
      weighted: data.weighted ?? false,
      diameter: data.diameter ?? 0,
      path,
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


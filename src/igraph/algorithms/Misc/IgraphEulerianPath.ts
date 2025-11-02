import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type EulerianPathOutputData = {
  start: string;
  end: string;
  path: {
    from: string;
    to: string;
    weight?: number;
  }[];
};

export type EulerianPathResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: EulerianPathOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.eulerian_path();
  } catch (e) {
    throw new Error("internal eulerian path error: " + e);
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): EulerianPathResult {
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
      start: mapIdBack(data.start),
      end: mapIdBack(data.end),
      path,
    },
  };
}

export async function igraphEulerianPath(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<EulerianPathResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}


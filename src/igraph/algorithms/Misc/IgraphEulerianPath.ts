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
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): EulerianPathResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      start: data.start,
      end: data.end,
      path: data.path,
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

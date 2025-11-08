import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

// TODO: more extensive testing
// Inferred from src/wasm/algorithms/path-finding.cpp (yen_source_to_target)
export type YenOutputData = {
  algorithm: string;
  source: string;
  target: string;
  k: number;
  weighted: boolean;
  paths: {
    num: number;
    path: string[];
    weight?: number;
  }[];
};

export type YenResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: YenOutputData;
};

async function _runIgraphAlgo(
  igraphMod: any,
  igraphStart: number,
  igraphEnd: number,
  k: number
): Promise<any> {
  try {
    return await igraphMod.yen_source_to_target(igraphStart, igraphEnd, k);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): YenResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Yen's k Shortest Paths",
      source: data.source,
      target: data.target,
      k: data.k,
      weighted: data.weighted,
      paths: data.paths ?? [],
    },
  };
}

export async function igraphYen(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string,
  kuzuTargetID: string,
  k: number
): Promise<YenResult> {
  const startIgraphId = graphData.KuzuToIgraphMap.get(kuzuSourceID);
  const endIgraphId = graphData.KuzuToIgraphMap.get(kuzuTargetID);

  if (startIgraphId === undefined || endIgraphId === undefined) {
    const weighted =
      Array.isArray(graphData.IgraphInput?.weight) &&
      graphData.IgraphInput.weight.length > 0;

    const colorMapOut: Record<string, number> = {};
    colorMapOut[String(kuzuSourceID)] = 1;
    colorMapOut[String(kuzuTargetID)] = 1;

    return {
      mode: 2,
      colorMap: colorMapOut,
      data: {
        algorithm: "Yen's k Shortest Paths",
        source: String(kuzuSourceID),
        target: String(kuzuTargetID),
        k,
        weighted,
        paths: [],
      },
    };
  }

  const wasmResult = await _runIgraphAlgo(
    igraphMod,
    startIgraphId,
    endIgraphId,
    k
  );
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

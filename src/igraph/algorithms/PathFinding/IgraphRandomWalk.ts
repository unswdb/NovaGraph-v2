import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

// Inferred from src/wasm/algorithms/path-finding.cpp (randomWalk)
export type RandomWalkOutputData = {
  algorithm: string;
  source: string;
  steps: number;
  weighted: boolean;
  maxFrequencyNode: string;
  maxFrequency: number;
  path: {
    step: number;
    from: string;
    to: string;
    weight?: number;
  }[];
};

export type RandomWalkResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: RandomWalkOutputData;
};

async function _runIgraphAlgo(
  igraphMod: any,
  igraphStart: number,
  steps: number
): Promise<any> {
  try {
    return await igraphMod.random_walk(igraphStart, steps);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): RandomWalkResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Random Walk",
      source: mapIdBack(data.source),
      steps: data.steps,
      weighted: data.weighted,
      maxFrequencyNode: mapIdBack(data.maxFrequencyNode),
      maxFrequency: data.maxFrequency,
      path: data.path ?? [],
    },
  };
}

export async function igraphRandomWalk(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string,
  steps: number
): Promise<RandomWalkResult> {
  const startIgraphId = graphData.KuzuToIgraphMap.get(kuzuSourceID);

  if (startIgraphId === undefined) {
    const weighted =
      Array.isArray(graphData.IgraphInput?.weight) &&
      graphData.IgraphInput.weight.length > 0;

    const colorMapOut: Record<string, number> = {};
    colorMapOut[String(kuzuSourceID)] = 1;

    return {
      mode: 2,
      colorMap: colorMapOut,
      data: {
        algorithm: "Random Walk",
        source: String(kuzuSourceID),
        steps,
        weighted,
        maxFrequencyNode: String(kuzuSourceID),
        maxFrequency: 0,
        path: [],
      },
    };
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, startIgraphId, steps);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

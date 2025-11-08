import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type VerticesAreAdjacentOutputData = {
  source: string;
  target: string;
  adjacent: boolean;
  weight?: number; // only if edge exists AND weights present
};

export type VerticesAreAdjacentResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: VerticesAreAdjacentOutputData;
};

async function _runIgraphAlgo(
  igraphMod: any,
  igraphSource: number,
  igraphTarget: number
): Promise<any> {
  try {
    return await igraphMod.vertices_are_adjacent(igraphSource, igraphTarget);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): VerticesAreAdjacentResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      source: data.source,
      target: data.target,
      adjacent: data.adjacent ?? false,
      weight: data.weight,
    },
  };
}

export async function igraphVerticesAreAdjacent(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string,
  kuzuTargetID: string
): Promise<VerticesAreAdjacentResult> {
  const sourceIgraphId = graphData.KuzuToIgraphMap.get(kuzuSourceID);
  const targetIgraphId = graphData.KuzuToIgraphMap.get(kuzuTargetID);

  if (sourceIgraphId === undefined || targetIgraphId === undefined) {
    const colorMapOut: Record<string, number> = {};
    colorMapOut[String(kuzuSourceID)] = 1;
    colorMapOut[String(kuzuTargetID)] = 1;

    return {
      mode: 2,
      colorMap: colorMapOut,
      data: {
        source: String(kuzuSourceID),
        target: String(kuzuTargetID),
        adjacent: false,
      },
    };
  }

  const wasmResult = await _runIgraphAlgo(
    igraphMod,
    sourceIgraphId,
    targetIgraphId
  );
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

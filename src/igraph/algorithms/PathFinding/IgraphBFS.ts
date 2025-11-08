import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type BFSData = {
  algorithm: string;
  source: string;
  nodesFound: number;
  layers: { layer: string[]; index: number }[];
};

export type BFSResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: BFSData;
};

async function _runIgraphAlgo(
  igraphMod: any,
  igraphSourceID: number
): Promise<BFSResult> {
  try {
    return await igraphMod.bfs(igraphSourceID);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: BFSResult
): BFSResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  return {
    mode: algorithmResult.mode,
    colorMap: mapColorMapIds(algorithmResult.colorMap, mapIdBack),
    data: {
      algorithm: algorithmResult.data.algorithm,
      source: algorithmResult.data.source,
      nodesFound: algorithmResult.data.nodesFound,
      layers: algorithmResult.data.layers,
    },
  };
}

export async function igraphBFS(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string
): Promise<BFSResult> {
  let igraphID: number | undefined =
    graphData.KuzuToIgraphMap.get(kuzuSourceID);

  if (igraphID === undefined) {
    console.warn("choosen source is either isolated or error in parsing");
    return {
      mode: 3,
      colorMap: {
        [kuzuSourceID]: 1,
      },
      data: {
        algorithm: "Breadth-First Search",
        source: kuzuSourceID,
        nodesFound: 1,
        layers: [
          {
            layer: [kuzuSourceID],
            index: 0,
          },
        ],
      },
    };
  }
  const wasmResult = await _runIgraphAlgo(igraphMod, igraphID);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

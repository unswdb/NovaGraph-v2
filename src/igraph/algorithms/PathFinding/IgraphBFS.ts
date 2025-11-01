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
  return await igraphMod.bfs(igraphSourceID);
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: BFSResult
): BFSResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  // Map the data back to Kuzu IDs
  const mappedData: BFSData = {
    algorithm: algorithmResult.data.algorithm,
    source: mapIdBack(algorithmResult.data.source),
    nodesFound: algorithmResult.data.nodesFound,
    layers: algorithmResult.data.layers.map((l) => ({
      layer: l.layer.map((x) => mapIdBack(x)),
      index: l.index,
    })),
  };

  return {
    mode: algorithmResult.mode,
    colorMap: mapColorMapIds(algorithmResult.colorMap, mapIdBack),
    data: mappedData,
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

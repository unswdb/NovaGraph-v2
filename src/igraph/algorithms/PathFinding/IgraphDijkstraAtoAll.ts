import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

// Infered from src/wasm/algorithms/path-finding.cpp lines 63-132
export type DijkstraAToAllOutputData = {
  algorithm: string;
  source: string;
  weighted: boolean;
  paths: { target: string; path: string[]; weight?: number }[];
};

export type DijkstraAToAllResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: DijkstraAToAllOutputData;
};

async function _runIgraphAlgo(
  igraphMod: any,
  igraphStart: number
): Promise<any> {
  return await igraphMod.dijkstra_source_to_all(igraphStart);
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): DijkstraAToAllResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  const paths = (data.paths ?? []).map((pathObj: any) => ({
    target: mapIdBack(pathObj.target),
    path: (pathObj.path ?? []).map((nodeId: string | number) => mapIdBack(nodeId)),
    weight: pathObj.weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Dijkstra Single Source",
      source: mapIdBack(data.source),
      weighted: data.weighted,
      paths,
    },
  };
}

export async function igraphDijkstraAToAll(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string
): Promise<DijkstraAToAllResult> {
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
        algorithm: "Dijkstra Single Source",
        source: String(kuzuSourceID),
        weighted,
        paths: [],
      },
    };
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, startIgraphId);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}


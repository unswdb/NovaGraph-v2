import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

// Inferred from src/wasm/algorithms/path-finding.cpp (dfs)
export type DFSOutputData = {
  algorithm: string;
  source: string;
  nodesFound: number;
  subtrees: { num: number; tree: string[] }[];
};

export type DFSResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: DFSOutputData;
};

async function _runIgraphAlgo(
  igraphMod: any,
  igraphSourceID: number
): Promise<any> {
  return await igraphMod.dfs(igraphSourceID);
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): DFSResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  const subtrees = (data.subtrees ?? []).map((s: any) => ({
    num: s.num,
    tree: (s.tree ?? []).map((nodeId: string | number) => mapIdBack(nodeId)),
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Depth-First Search",
      source: mapIdBack(data.source),
      nodesFound: data.nodesFound,
      subtrees,
    },
  };
}

export async function igraphDFS(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string
): Promise<DFSResult> {
  const igraphID = graphData.KuzuToIgraphMap.get(kuzuSourceID);

  if (igraphID === undefined) {
    const colorMapOut: Record<string, number> = { [kuzuSourceID]: 1 };
    return {
      mode: 3,
      colorMap: colorMapOut,
      data: {
        algorithm: "Depth-First Search",
        source: kuzuSourceID,
        nodesFound: 1,
        subtrees: [
          {
            num: 1,
            tree: [kuzuSourceID],
          },
        ],
      },
    };
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, igraphID);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}



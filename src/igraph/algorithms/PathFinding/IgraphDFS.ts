import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

// Inferred from src/wasm/algorithms/path-finding.cpp (dfs)
export type DFSOutputData<T = string> = {
  algorithm: string;
  source: T;
  nodesFound: number;
  subtrees: { num: number; tree: T[] }[];
};

export type DFSResult<T = string> = BaseGraphAlgorithmResult & {
  data: DFSOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: DFSResult<number>
): DFSResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  const subtrees = data.subtrees.map((s) => ({
    num: s.num,
    tree: s.tree.map((nodeId: string | number) => mapLabelBack(nodeId)),
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Depth-First Search",
      source: mapLabelBack(data.source),
      nodesFound: data.nodesFound,
      subtrees,
    },
  };
}

export async function igraphDFS(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string
): Promise<DFSResult> {
  const igraphID = graphData.KuzuToIgraphMap.get(kuzuSourceID);

  if (igraphID == null) {
    throw new Error(`Source node "${kuzuSourceID}" not found in graph data`);
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, (m) => m.dfs(igraphID));
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

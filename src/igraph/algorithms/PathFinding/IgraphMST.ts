import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

// Infered from src/wasm/algorithms/path-finding.cpp
export type MinimalSpanningTreeOutputData<T = string> = {
  algorithm: string;
  weighted: boolean;
  maxEdges: number; // ecount of original graph
  totalWeight?: number; // only if weighted (sum over MST edges)
  edges: {
    num: number; // 1-based order in returned MST list
    from: T;
    to: T;
    weight?: number;
  }[];
};

export type MSTResult<T = string> = BaseGraphAlgorithmResult & {
  data: MinimalSpanningTreeOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: MSTResult<number>
): MSTResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  const edges = data.edges.map(({ num, from, to, weight }) => ({
    num: num,
    from: mapLabelBack(from),
    to: mapLabelBack(to),
    weight: weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      weighted: data.weighted,
      maxEdges: data.maxEdges,
      totalWeight: data.totalWeight,
      edges,
    },
  };
}

export async function igraphMST(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<MSTResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.min_spanning_tree()
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

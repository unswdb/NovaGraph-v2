import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";
import type { GraphNode } from "~/features/visualizer/types";

// Inferred from src/wasm/algorithms/path-finding.cpp (bf_source_to_target)
export type BellmanFordAToBOutputData<T = string> = {
  algorithm: string;
  source: T;
  target: T;
  weighted: boolean;
  path: { from: T; to: T; weight?: number }[];
  totalWeight?: number;
};

export type BellmanFordAToBResult<T = string> = BaseGraphAlgorithmResult & {
  data: BellmanFordAToBOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: BellmanFordAToBResult<number>
): BellmanFordAToBResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  const path = data.path.map(({ from, to, weight }) => ({
    from: mapLabelBack(from),
    to: mapLabelBack(to),
    weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      source: mapLabelBack(data.source),
      target: mapLabelBack(data.target),
      weighted: data.weighted,
      path,
      totalWeight: data.totalWeight,
    },
  };
}

export async function igraphBellmanFordAToB(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string,
  kuzuTargetID: string
): Promise<BellmanFordAToBResult> {
  const startIgraphId = graphData.KuzuToIgraphMap.get(kuzuSourceID);
  const endIgraphId = graphData.KuzuToIgraphMap.get(kuzuTargetID);

  if (startIgraphId == null || endIgraphId == null) {
    throw new Error(
      `Source node "${kuzuSourceID}" or target node "${kuzuTargetID}" not found in graph data`
    );
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.bellman_ford_source_to_target(startIgraphId, endIgraphId)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

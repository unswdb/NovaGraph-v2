import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type FastGreedyOutputData<T = string> = {
  algorithm: string;
  modularity: number;
  communities: T[][]; // index = community id, value = node-name[]
};

export type FastGreedyResult<T = string> = BaseGraphAlgorithmResult & {
  data: FastGreedyOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: FastGreedyResult<number>
): FastGreedyResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      modularity: data.modularity ?? 0,
      communities: data.communities.map((communityGroup) =>
        communityGroup.map((communityItem) => mapLabelBack(communityItem))
      ),
    },
  };
}

export async function igraphFastGreedy(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<FastGreedyResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) => m.fast_greedy());
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

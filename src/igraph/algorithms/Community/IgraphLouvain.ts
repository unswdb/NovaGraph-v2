import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type LouvainOutputData<T = string> = {
  algorithm: string;
  modularity: number;
  communities: T[][]; // index = community id, value = node-name[]
};

export type LouvainResult<T = string> = BaseGraphAlgorithmResult & {
  data: LouvainOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: LouvainResult<number>
): LouvainResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      modularity: data.modularity,
      communities: data.communities.map((communityGroup) =>
        communityGroup.map((communityItem) => mapLabelBack(communityItem))
      ),
    },
  };
}

export async function igraphLouvain(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  resolution: number
): Promise<LouvainResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.louvain(resolution)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

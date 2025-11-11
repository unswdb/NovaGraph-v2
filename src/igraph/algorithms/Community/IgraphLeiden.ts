import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type LeidenOutputData<T = string> = {
  modularity: number;
  quality: number;
  communities: T[][]; // index = community id, value = node-name[]
};

export type LeidenResult<T = string> = BaseGraphAlgorithmResult & {
  data: LeidenOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: LeidenResult<number>
): LeidenResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      modularity: data.modularity,
      quality: data.quality,
      communities: data.communities.map((communityGroup) =>
        communityGroup.map((communityItem) => mapLabelBack(communityItem))
      ),
    },
  };
}

export async function igraphLeiden(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  resolution: number
): Promise<LeidenResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.leiden(resolution)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

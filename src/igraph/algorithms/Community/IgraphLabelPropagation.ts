import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type LabelPropagationOutputData<T = string> = {
  algorithm: string;
  communities: T[][]; // index = community id, value = node-name[]
};

export type LabelPropagationResult<T = string> = BaseGraphAlgorithmResult & {
  data: LabelPropagationOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: LabelPropagationResult<number>
): LabelPropagationResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      communities: data.communities.map((communityGroup) =>
        communityGroup.map((communityItem) => mapLabelBack(communityItem))
      ),
    },
  };
}

export async function igraphLabelPropagation(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<LabelPropagationResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.label_propagation()
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

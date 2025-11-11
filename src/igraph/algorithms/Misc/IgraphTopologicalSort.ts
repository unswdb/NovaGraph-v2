import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type TopologicalSortOutputData<T = string> = {
  algorithm: string;
  order: T[]; // node id in topological order
};

export type TopologicalSortResult<T = string> = BaseGraphAlgorithmResult & {
  data: TopologicalSortOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: TopologicalSortResult<number>
): TopologicalSortResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      order: data.order.map((o) => mapLabelBack(o)),
    },
  };
}

export async function igraphTopologicalSort(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<TopologicalSortResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.topological_sort()
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

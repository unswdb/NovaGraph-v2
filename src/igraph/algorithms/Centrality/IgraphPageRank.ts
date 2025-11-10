import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import { _parseCentralities, type CentralityItem } from "./util";

import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";
import type { GraphNode } from "~/features/visualizer/types";

export type PageRankOutputData<T = string> = {
  algorithm: string;
  damping: string;
  centralities: CentralityItem<T>[];
};

export type PageRankResult<T = string> = BaseGraphAlgorithmResult & {
  data: PageRankOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: PageRankResult<number>
): PageRankResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      damping: data.damping,
      centralities: _parseCentralities(data.centralities, mapLabelBack),
    },
  };
}

export async function igraphPageRank(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  damping: number
): Promise<PageRankResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.pagerank(damping)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

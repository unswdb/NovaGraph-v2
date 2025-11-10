import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import { _parseCentralities, type CentralityItem } from "./util";

import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";
import type { GraphNode } from "~/features/visualizer/types";

export type BetweennessCentralityOutputData<T = string> = {
  algorithm: string;
  centralities: CentralityItem<T>[];
};

export type BetweennessCentralityResult<T = string> =
  BaseGraphAlgorithmResult & {
    data: BetweennessCentralityOutputData<T>;
  };

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: BetweennessCentralityResult<number>
): BetweennessCentralityResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      centralities: _parseCentralities(data.centralities, mapLabelBack),
    },
  };
}

export async function igraphBetweennessCentrality(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<BetweennessCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.betweenness_centrality()
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

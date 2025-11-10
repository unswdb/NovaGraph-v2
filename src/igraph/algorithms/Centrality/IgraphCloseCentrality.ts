import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import { _parseCentralities, type CentralityItem } from "./util";

import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";
import type { GraphNode } from "~/features/visualizer/types";

export type ClosenessCentralityOutputData<T = string> = {
  algorithm: string;
  centralities: CentralityItem<T>[];
};

export type ClosenessCentralityResult<T = string> = BaseGraphAlgorithmResult & {
  data: ClosenessCentralityOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: ClosenessCentralityResult<number>
): ClosenessCentralityResult {
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

export async function igraphClosenessCentrality(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<ClosenessCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.closeness_centrality()
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import { _parseCentralities, type CentralityItem } from "./util";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type EigenvectorCentralityOutputData<T = string> = {
  algorithm: string;
  eigenvalue: number;
  centralities: CentralityItem<T>[];
};

export type EigenvectorCentralityResult<T = string> =
  BaseGraphAlgorithmResult & {
    data: EigenvectorCentralityOutputData<T>;
  };

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: EigenvectorCentralityResult<number>
): EigenvectorCentralityResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {}, sizeMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    sizeMap: mapColorMapIds(sizeMap, mapIdBack),
    data: {
      algorithm: data.algorithm ?? "Eigenvector Centrality",
      eigenvalue: data.eigenvalue ?? 0,
      centralities: _parseCentralities(data.centralities, mapLabelBack),
    },
  };
}

export async function igraphEigenvectorCentrality(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<EigenvectorCentralityResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.eigenvector_centrality()
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

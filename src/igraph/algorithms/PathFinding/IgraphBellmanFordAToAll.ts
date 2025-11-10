import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";
import type { GraphNode } from "~/features/visualizer/types";

// Todo: more extensive testing
// Inferred from src/wasm/algorithms/path-finding.cpp (bf_source_to_all)
export type BellmanFordAToAllOutputData<T = string> = {
  algorithm: string;
  source: T;
  weighted: boolean;
  paths: { target: T; path: T[]; weight?: number }[];
};

export type BellmanFordAToAllResult<T = string> = BaseGraphAlgorithmResult & {
  data: BellmanFordAToAllOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: BellmanFordAToAllResult<number>
): BellmanFordAToAllResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  const paths = data.paths.map((pathObj) => ({
    target: mapLabelBack(pathObj.target),
    path: pathObj.path.map((nodeId: string | number) => mapLabelBack(nodeId)),
    weight: pathObj.weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      source: mapLabelBack(data.source),
      weighted: data.weighted,
      paths,
    },
  };
}

export async function igraphBellmanFordAToAll(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string
): Promise<BellmanFordAToAllResult> {
  const startIgraphId = graphData.KuzuToIgraphMap.get(kuzuSourceID);

  if (startIgraphId == null) {
    throw new Error(`Source node "${kuzuSourceID}" not found in graph data`);
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.bellman_ford_source_to_all(startIgraphId)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

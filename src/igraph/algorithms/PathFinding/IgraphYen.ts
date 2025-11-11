import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

// TODO: more extensive testing
// Inferred from src/wasm/algorithms/path-finding.cpp (yen_source_to_target)
export type YenOutputData<T = string> = {
  algorithm: string;
  source: T;
  target: T;
  k: number;
  weighted: boolean;
  paths: {
    num: number;
    path: T[];
    weight?: number;
  }[];
};

export type YenResult<T = string> = BaseGraphAlgorithmResult & {
  data: YenOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: YenResult<number>
): YenResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  const paths = data.paths.map((p) => ({
    num: p.num,
    path: p.path.map((nodeId: string | number) => mapLabelBack(nodeId)),
    weight: p.weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      source: mapLabelBack(data.source),
      target: mapLabelBack(data.target),
      k: data.k,
      weighted: data.weighted,
      paths,
    },
  };
}

export async function igraphYen(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string,
  kuzuTargetID: string,
  k: number
): Promise<YenResult> {
  const startIgraphId = graphData.KuzuToIgraphMap.get(kuzuSourceID);
  const endIgraphId = graphData.KuzuToIgraphMap.get(kuzuTargetID);

  if (startIgraphId == null || endIgraphId == null) {
    throw new Error(
      `Source node "${kuzuSourceID}" or target node "${kuzuTargetID}" not found in graph data`
    );
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.yen_source_to_target(startIgraphId, endIgraphId, k)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

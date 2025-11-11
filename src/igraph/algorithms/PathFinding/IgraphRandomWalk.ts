import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

// Inferred from src/wasm/algorithms/path-finding.cpp (randomWalk)
export type RandomWalkOutputData<T = string> = {
  algorithm: string;
  source: T;
  steps: number;
  weighted: boolean;
  maxFrequencyNode: T;
  maxFrequency: number;
  path: {
    step: number;
    from: T;
    to: T;
    weight?: number;
  }[];
};

export type RandomWalkResult<T = string> = BaseGraphAlgorithmResult & {
  data: RandomWalkOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: RandomWalkResult<number>
): RandomWalkResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  const path = data.path.map((p) => ({
    step: p.step,
    from: mapLabelBack(p.from),
    to: mapLabelBack(p.to),
    weight: p.weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      source: mapLabelBack(data.source),
      steps: data.steps,
      weighted: data.weighted,
      maxFrequencyNode: mapLabelBack(data.maxFrequencyNode),
      maxFrequency: data.maxFrequency,
      path,
    },
  };
}

export async function igraphRandomWalk(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string,
  steps: number
): Promise<RandomWalkResult> {
  const startIgraphId = graphData.KuzuToIgraphMap.get(kuzuSourceID);

  if (startIgraphId == null) {
    throw new Error(`Source node "${kuzuSourceID}" not found in graph data`);
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.random_walk(startIgraphId, steps)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

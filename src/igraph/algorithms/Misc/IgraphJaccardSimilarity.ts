import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type JaccardSimilarityOutputData<T = string> = {
  algorithm: string;
  nodes: T[];
  similarityMatrix: number[][];
  maxSimilarity: {
    node1: T;
    node2: T;
    similarity: number;
  };
};

export type JaccardSimilarityResult<T = string> = BaseGraphAlgorithmResult & {
  data: JaccardSimilarityOutputData<T>;
};

function mapKuzuIdsToIgraphIds(
  kuzuIds: string[],
  kuzuToIgraph: Map<string, number>
): number[] {
  const igraphIds: number[] = [];
  for (const id of kuzuIds) {
    const mapped = kuzuToIgraph.get(id);
    if (mapped == null) {
      throw new Error(`Unknown node id '${id}'`);
    }
    igraphIds.push(mapped);
  }
  return igraphIds;
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: JaccardSimilarityResult<number>
): JaccardSimilarityResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      nodes: data.nodes.map((n) => mapLabelBack(n)),
      similarityMatrix: data.similarityMatrix,
      maxSimilarity: {
        node1: mapLabelBack(data.maxSimilarity.node1),
        node2: mapLabelBack(data.maxSimilarity.node2),
        similarity: data.maxSimilarity.similarity,
      },
    },
  };
}

export async function igraphJaccardSimilarity(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  kuzuNodeIds: string[]
): Promise<JaccardSimilarityResult> {
  const igraphIds = mapKuzuIdsToIgraphIds(
    kuzuNodeIds,
    graphData.KuzuToIgraphMap
  );
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.jaccard_similarity(igraphIds)
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

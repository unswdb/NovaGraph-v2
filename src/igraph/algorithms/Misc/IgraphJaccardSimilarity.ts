import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type JaccardSimilarityOutputData = {
  nodes: string[];
  similarityMatrix: number[][];
  maxSimilarity: {
    node1: string;
    node2: string;
    similarity: number;
  };
};

export type JaccardSimilarityResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: JaccardSimilarityOutputData;
};

function mapKuzuIdsToIgraphIds(
  kuzuIds: string[],
  kuzuToIgraph: Map<string, number>
): number[] {
  const igraphIds: number[] = [];
  for (const id of kuzuIds) {
    const mapped = kuzuToIgraph.get(id);
    if (mapped === undefined) {
      throw new Error(`Unknown node id '${id}'`);
    }
    igraphIds.push(mapped);
  }
  return igraphIds;
}

async function _runIgraphAlgo(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  igraphIds: number[]
): Promise<any> {
  try {
    return await igraphMod.jaccard_similarity(igraphIds);
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): JaccardSimilarityResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  const maxSimilarity = data.maxSimilarity ?? {
    node1: "",
    node2: "",
    similarity: 0,
  };

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      nodes: data.nodes,
      similarityMatrix: data.similarityMatrix ?? [],
      maxSimilarity: {
        node1: maxSimilarity.node1,
        node2: maxSimilarity.node2,
        similarity: maxSimilarity.similarity ?? 0,
      },
    },
  };
}

export async function igraphJaccardSimilarity(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult,
  kuzuNodeIds: string[]
): Promise<JaccardSimilarityResult> {
  const igraphIds = mapKuzuIdsToIgraphIds(
    kuzuNodeIds,
    graphData.KuzuToIgraphMap
  );
  const wasmResult = await _runIgraphAlgo(igraphMod, graphData, igraphIds);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

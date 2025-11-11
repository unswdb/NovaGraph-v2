import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";
import type { GraphNode } from "~/features/visualizer/types";

export type BFSOutputData<T = string> = {
  algorithm: string;
  source: T;
  nodesFound: number;
  layers: { layer: T[]; index: number }[];
};

export type BFSResult<T = string> = BaseGraphAlgorithmResult & {
  data: BFSOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: BFSResult<number>
): BFSResult {
  const { mapLabelBack, mapIdBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  return {
    mode: algorithmResult.mode,
    colorMap: mapColorMapIds(algorithmResult.colorMap, mapIdBack),
    data: {
      algorithm: algorithmResult.data.algorithm,
      source: mapLabelBack(algorithmResult.data.source),
      nodesFound: algorithmResult.data.nodesFound,
      layers: algorithmResult.data.layers.map((l) => ({
        layer: l.layer.map((x) => mapLabelBack(x)),
        index: l.index,
      })),
    },
  };
}

export async function igraphBFS(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult,
  kuzuSourceID: string
): Promise<BFSResult> {
  let igraphID: number | undefined =
    graphData.KuzuToIgraphMap.get(kuzuSourceID);

  if (igraphID == null) {
    throw new Error(`Source node "${kuzuSourceID}" not found in graph data`);
  }

  const wasmResult = await _runIgraphAlgo(igraphMod, (m) => m.bfs(igraphID));
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

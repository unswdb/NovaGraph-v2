import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type TriangleCountOutputData<T = string> = {
  algorithm: string;
  triangles: {
    id: number; // 1-based triangle id
    node1: T;
    node2: T;
    node3: T;
  }[];
};

export type TriangleCountResult<T = string> = BaseGraphAlgorithmResult & {
  data: TriangleCountOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: TriangleCountResult<number>
): TriangleCountResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      triangles: data.triangles.map((triangle) => ({
        id: triangle.id,
        node1: mapLabelBack(triangle.node1),
        node2: mapLabelBack(triangle.node2),
        node3: mapLabelBack(triangle.node3),
      })),
    },
  };
}

export async function igraphTriangles(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<TriangleCountResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) => m.triangle_count());
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

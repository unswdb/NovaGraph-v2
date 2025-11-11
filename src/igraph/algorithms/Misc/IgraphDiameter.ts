import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type GraphDiameterOutputData<T = string> = {
  algorithm: string;
  source: T;
  target: T;
  weighted: boolean;
  diameter: number;
  path: {
    from: T;
    to: T;
    weight?: number; // per-edge, only if weighted
  }[];
};

export type GraphDiameterResult<T = string> = BaseGraphAlgorithmResult & {
  data: GraphDiameterOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: GraphDiameterResult<number>
): GraphDiameterResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  const path = data.path.map(({ from, to, weight }) => ({
    from: mapLabelBack(from),
    to: mapLabelBack(to),
    weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      source: mapLabelBack(data.source),
      target: mapLabelBack(data.target),
      weighted: data.weighted,
      diameter: data.diameter,
      path,
    },
  };
}

export async function igraphDiameter(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<GraphDiameterResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) => m.diameter());
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type EulerianPathOutputData<T = string> = {
  algorithm: string;
  start: T;
  end: T;
  path: {
    from: T;
    to: T;
    weight?: number;
  }[];
};

export type EulerianPathResult<T = string> = BaseGraphAlgorithmResult & {
  data: EulerianPathOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: EulerianPathResult<number>
): EulerianPathResult {
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
      start: mapLabelBack(data.start),
      end: mapLabelBack(data.end),
      path,
    },
  };
}

export async function igraphEulerianPath(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<EulerianPathResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) => m.eulerian_path());
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

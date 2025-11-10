import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type EulerianCircuitOutputData<T = string> = {
  algorithm: string;
  path: {
    from: T;
    to: T;
    weight?: number;
  }[];
};

export type EulerianCircuitResult<T = string> = BaseGraphAlgorithmResult & {
  data: EulerianCircuitOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: EulerianCircuitResult<number>
): EulerianCircuitResult {
  const { mapLabelBack, mapIdBack } = createMapIdBack(IgraphToKuzu, nodesMap);

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
      path,
    },
  };
}

export async function igraphEulerianCircuit(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<EulerianCircuitResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.eulerian_circuit()
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

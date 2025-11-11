import type {
  BaseGraphAlgorithmResult,
  GraphModule,
  KuzuToIgraphParseResult,
} from "../../types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapIdBack";

import type { GraphNode } from "~/features/visualizer/types";
import { _runIgraphAlgo } from "~/igraph/utils/runIgraphAlgo";

export type SCCOutputData<T = string> = {
  algorithm: string;
  components: T[][]; // index = component id, value = node-name[]
};

export type SCCResult<T = string> = BaseGraphAlgorithmResult & {
  data: SCCOutputData<T>;
};

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  nodesMap: Map<string, GraphNode>,
  algorithmResult: SCCResult<number>
): SCCResult {
  const { mapIdBack, mapLabelBack } = createMapIdBack(IgraphToKuzu, nodesMap);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      algorithm: data.algorithm,
      components: data.components.map((componentGroup) =>
        componentGroup.map((component) => mapLabelBack(component))
      ),
    },
  };
}

export async function igraphStronglyConnectedComponents(
  igraphMod: GraphModule,
  graphData: KuzuToIgraphParseResult
): Promise<SCCResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod, (m) =>
    m.strongly_connected_components()
  );
  return _parseResult(
    graphData.IgraphToKuzuMap,
    graphData.nodesMap,
    wasmResult
  );
}

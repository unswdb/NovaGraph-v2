import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type EulerianCircuitOutputData = {
  path: {
    from: string;
    to: string;
    weight?: number;
  }[];
};

export type EulerianCircuitResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: EulerianCircuitOutputData;
};

async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.eulerian_circuit();
  } catch (e) {
    throw new Error(igraphMod.what_to_stderr(e));
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): EulerianCircuitResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      path: data.path,
    },
  };
}

export async function igraphEulerianCircuit(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<EulerianCircuitResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}

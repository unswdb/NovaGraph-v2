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
    throw new Error("internal eulerian circuit error: " + e);
  }
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): EulerianCircuitResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  const path = (data.path ?? []).map(({ from, to, weight }: any) => ({
    from: mapIdBack(from),
    to: mapIdBack(to),
    weight,
  }));

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      path,
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


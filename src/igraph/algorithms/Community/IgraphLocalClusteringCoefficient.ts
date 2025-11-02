import type { KuzuToIgraphParseResult } from "../../types/types";
import { createMapIdBack, mapColorMapIds } from "../../utils/mapColorMapIds";

export type LocalClusteringCoefficientOutputData = {
  global_coefficient: number; // 4 dp, avg-ignore-zeros
  coefficients: {
    id: number; // vertex id
    node: string; // vertex name
    value: number; // 4 dp (can be NaN when undefined)
  }[];
};

export type LocalClusteringCoefficientResult = {
  colorMap: Record<string, number>;
  mode: number;
  data: LocalClusteringCoefficientOutputData;
};

// TODO: more comprehensive testing
async function _runIgraphAlgo(igraphMod: any): Promise<any> {
  try {
    return await igraphMod.label_propagation();
  } catch (e) {
    throw new Error("internal label propagation error: " + e);
  }
}

function _parseCoefficients(
  coefficients: any,
  mapIdBack: (id: string | number) => string
): LocalClusteringCoefficientOutputData["coefficients"] {
  if (!coefficients) {
    return [];
  }

  const result: LocalClusteringCoefficientOutputData["coefficients"] = [];
  
  // The WASM returns coefficients as an object/array where keys are vertex indices
  // and values are objects with id, node, and value properties
  const keys = Object.keys(coefficients).map(Number).sort((a, b) => a - b);
  
  for (const key of keys) {
    const coefficient = coefficients[key];
    if (coefficient && typeof coefficient === "object") {
      const id = typeof coefficient.id === "number" ? coefficient.id : key;
      const node = typeof coefficient.node === "string" 
        ? coefficient.node 
        : mapIdBack(id);
      const value = typeof coefficient.value === "number" 
        ? coefficient.value 
        : NaN;
      
      result.push({ id, node, value });
    }
  }
  
  return result;
}

function _parseResult(
  IgraphToKuzu: Map<number, string>,
  algorithmResult: any
): LocalClusteringCoefficientResult {
  const mapIdBack = createMapIdBack(IgraphToKuzu);

  const { data, mode, colorMap = {} } = algorithmResult;

  return {
    mode,
    colorMap: mapColorMapIds(colorMap, mapIdBack),
    data: {
      global_coefficient: data.global_coefficient ?? 0,
      coefficients: _parseCoefficients(data.coefficients, mapIdBack),
    },
  };
}

export async function igraphLocalClusteringCoefficient(
  igraphMod: any,
  graphData: KuzuToIgraphParseResult
): Promise<LocalClusteringCoefficientResult> {
  const wasmResult = await _runIgraphAlgo(igraphMod);
  return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}


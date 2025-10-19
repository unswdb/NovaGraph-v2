import type { ExecuteQueryResult } from "../types";
import type { ColorMap, SizeMap } from "../algorithms/implementations";

import type { QueryVisualizationResult } from "./types";
import { MODE } from "../renderer/constant";

/**
 * Converts a Kuzu query result to a visualization result format
 * that can be used with activeResponse for visualization.
 *
 * @param queryResult - The full query result from executeQuery
 * @returns QueryVisualizationResult with colorMap, sizeMap, mode and queryData
 *
 * @example
 * const result = await executeQuery("MATCH (n:Person)-[r:KNOWS]->(m) RETURN n, r, m");
 * const visualizationResult = convertQueryToVisualizationResult(result);
 * setActiveResponse(visualizationResult);
 */
export function convertQueryToVisualizationResult(
  queryResult: ExecuteQueryResult
): QueryVisualizationResult {
  const colorMap: ColorMap = queryResult.colorMap ?? {};
  return {
    type: "query",
    colorMap,
    mode: MODE.COLOR_SHADE_DEFAULT,
    queryData: queryResult, // Include the original query data for display
  };
}

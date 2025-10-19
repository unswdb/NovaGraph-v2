import type { ExecuteQueryResult } from "../types";
import type { ColorMap, SizeMap } from "../algorithms/implementations";

import type { QueryVisualizationResult } from "./types";

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
  const colorMap: ColorMap = queryResult.colorMap || {};

  // Create sizeMap for matched nodes to make them larger and more visible
  const sizeMap: SizeMap = {};

  // Iterate through colorMap to find matched nodes (not edges)
  for (const key in colorMap) {
    // Check if it's a node (format: "table_offset") not an edge (format: "source-target")
    if (!key.includes("-")) {
      // Make matched nodes 2.5x larger for better visibility
      sizeMap[key] = 20; // Highlighted node size (default is 7)
    }
  }

  // MODE.COLOR_SHADE_DEFAULT = 2
  // This mode uses gradient colors for highlighted nodes
  return {
    type: "query",
    colorMap,
    sizeMap,
    mode: 2, // COLOR_SHADE_DEFAULT mode
    queryData: queryResult, // Include the original query data for display
  };
}

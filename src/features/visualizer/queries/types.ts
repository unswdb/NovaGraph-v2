import type { ReactNode } from "react";

import type { ExecuteQueryResult } from "../types";
import type { ColorMap, SizeMap } from "../algorithms/implementations";

/**
 * Query result that can be used for visualization
 * Compatible with BaseGraphAlgorithmResult for rendering
 */
export interface QueryVisualizationResult {
  type: "query";
  colorMap: ColorMap;
  sizeMap?: SizeMap;
  mode: number;
  queryData: ExecuteQueryResult; // Original query result data
}

/**
 * Query output component props
 */
export interface QueryOutputProps {
  data: ExecuteQueryResult;
}

/**
 * Query output component type
 */
export type QueryOutputComponent = (props: QueryOutputProps) => ReactNode;

import { Route } from "lucide-react";
import * as GRAPH_TRAVERSAL from "./traversal";
import { type BaseGraphAlgorithm } from "./types";
import type { ElementType } from "react";

// Export all algorithms
const ALL_ALGORITHMS: {
  label: string;
  icon: ElementType;
  algorithms: BaseGraphAlgorithm[];
}[] = [
  {
    label: "Graph Traversal",
    icon: Route,
    algorithms: Object.values(GRAPH_TRAVERSAL) as BaseGraphAlgorithm[],
  },
];
export default ALL_ALGORITHMS;

// Export algorithm type
export {
  type BaseGraphAlgorithmResult,
  type BaseGraphAlgorithm,
  type GraphAlgorithm,
  type GraphAlgorithmInput,
  type SelectInput,
  type NumberInput,
  type SizeMap,
  type ColorMap,
} from "./types";

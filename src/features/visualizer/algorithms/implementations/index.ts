import { Route } from "lucide-react";
import * as GRAPH_TRAVERSAL from "./graph-traversal";
import { type BaseGraphAlgorithm } from "./implementations.types";
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
    algorithms: Object.values(GRAPH_TRAVERSAL),
  },
];
export default ALL_ALGORITHMS;

// Export algorithm type
export {
  type BaseGraphAlgorithm,
  type GraphAlgorithm,
  type GraphAlgorithmInput,
  type SelectInput,
  type NumberInput,
} from "./implementations.types";

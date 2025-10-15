import { GitBranch, Puzzle, Route, Star, Users, Waypoints } from "lucide-react";
import type { ElementType } from "react";

import * as TRAVERSAL_CONNECTIVITY from "./traversal-connectivity";
import * as PATH_REACHABILITY from "./path-reachability";
import * as CENTRALITY_NODE_IMPORTANCE from "./centrality";
import * as COMMUNITY_DETECTION from "./community-detection";
import * as GRAPH_SIMILARITY_MATCHING from "./similarity-matching";
import { type BaseGraphAlgorithm } from "./types";

// Export all algorithms
const ALL_ALGORITHMS: {
  label: string;
  icon: ElementType;
  algorithms: BaseGraphAlgorithm[];
}[] = [
  {
    label: "Traversal & Connectivity",
    icon: GitBranch,
    algorithms: Object.values(TRAVERSAL_CONNECTIVITY) as BaseGraphAlgorithm[],
  },
  {
    label: "Path & Reachability",
    icon: Route,
    algorithms: Object.values(PATH_REACHABILITY) as BaseGraphAlgorithm[],
  },
  {
    label: "Centrality",
    icon: Star,
    algorithms: Object.values(
      CENTRALITY_NODE_IMPORTANCE
    ) as BaseGraphAlgorithm[],
  },
  {
    label: "Community Detection",
    icon: Users,
    algorithms: Object.values(COMMUNITY_DETECTION) as BaseGraphAlgorithm[],
  },
  {
    label: "Graph Similarity & Matching",
    icon: Puzzle,
    algorithms: Object.values(
      GRAPH_SIMILARITY_MATCHING
    ) as BaseGraphAlgorithm[],
  },
];
export default ALL_ALGORITHMS;

// Export algorithm type
export {
  type BaseGraphAlgorithmResult,
  type BaseGraphAlgorithm,
  type GraphAlgorithm,
  type SizeMap,
  type ColorMap,
} from "./types";

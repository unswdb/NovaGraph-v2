import type { KuzuToIgraphParseResult } from "../types";

import type { GraphEdge, GraphNode } from "~/features/visualizer/types";

/**
 * Convert Kuzu input into Igraph input
 */
export function parseKuzuToIgraphInput(
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed: boolean
): KuzuToIgraphParseResult {
  if (nodes.length > 0x80000000) {
    throw new Error(
      "Vertex ID exceeds 32-bit signed range expected by igraph 32 bit (WASM)."
    );
  }

  let KuzuToIgraph = new Map<string, number>();
  let IgraphToKuzu = new Map<number, string>();

  const E = edges.length;

  // Edge lists (32-bit signed to match typical igraph_int_t in wasm32 builds)
  const src = new Int32Array(E);
  const dst = new Int32Array(E);

  let weight: Float64Array | undefined; // allocate lazily when we see the first numeric weight
  let nextId = KuzuToIgraph.size;

  const getOrAssign = (label: string): number => {
    const existing = KuzuToIgraph.get(label);
    if (existing !== undefined) return existing;

    // Guard against exceeding 32-bit signed max (2^31 - 1)
    if (nextId >= 0x7fffffff) {
      throw new Error(
        "Vertex ID exceeds 32-bit signed range expected by igraph 32-bit (WASM)."
      );
    }

    const id = nextId++;
    KuzuToIgraph.set(label, id);
    IgraphToKuzu.set(id, label);

    return id;
  };

  for (let i = 0; i < E; i++) {
    const e = edges[i];

    const sId = getOrAssign(e.source);
    const tId = getOrAssign(e.target);
    src[i] = sId;
    dst[i] = tId;

    if (e.attributes) {
      const weightKey = Object.keys(e.attributes).find(
        (key) => key.toLowerCase() === "weight"
      );
      if (weightKey) {
        const val = e.attributes[weightKey];
        let numVal: string | number | boolean | null = null;
        if (typeof val === "number") {
          numVal = val;
        } else if (val instanceof Number) {
          numVal = val.valueOf();
        }

        if (
          typeof numVal !== "string" &&
          typeof numVal !== "boolean" &&
          numVal !== null &&
          Number.isFinite(numVal)
        ) {
          if (!weight) weight = new Float64Array(E); // default zeros
          weight[i] = numVal;
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            `[KuzuToIgraphParsing] Non-numeric weight at edge ${i} (${e.source} -> ${e.target}); treated as 0.`
          );
        }
      }
    }
  }

  // Make sure all declared nodes get an ID
  // including isolated ones
  for (const node of nodes) {
    getOrAssign(node.id);
  }

  const nodesAssigned = nextId;
  if (nodes.length < nodesAssigned) {
    throw new Error(
      `Inconsistent graph: edge list references ${nodesAssigned} unique nodes, but only ${nodes.length} declared.`
    );
  }

  // Build node map
  const nodesMap: Map<string, GraphNode> = new Map(
    nodes.map((node) => [node.id, node])
  );

  return {
    IgraphInput: { nodes: nodesAssigned, src, dst, directed, weight },
    KuzuToIgraphMap: KuzuToIgraph,
    IgraphToKuzuMap: IgraphToKuzu,
    nodesMap,
  };
}

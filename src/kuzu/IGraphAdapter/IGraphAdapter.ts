import type { IGraphInput } from "./IGraphAdapter.types";
import type { GraphEdge } from "~/features/visualizer/types";

/**
 * Convert Kuzu input into Igraph input
 */
export function KuzuToIgraphParsing(
  nodesNumber: number,
  edges: GraphEdge[],
  directed: boolean,
  KuzuToIgraph: Map<string, number>, // Map Kuzu ID to Igraph ID
  IgraphToKuzu: Map<number, string> // Map back Igraph ID to Kuzu ID
): IGraphInput {
  if (nodesNumber > 0x80000000) {
    throw new Error(
      "Vertex ID exceeds 32-bit signed range expected by igraph 32 bit (WASM)."
    );
  }
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

    // Strict numeric weights only
    if (
      e.attributes &&
      Object.prototype.hasOwnProperty.call(e.attributes, "weight")
    ) {
      const val = (e.attributes as any)["weight"];
      if (typeof val === "number" && Number.isFinite(val)) {
        if (!weight) weight = new Float64Array(E); // default zeros
        weight[i] = val;
      } else {
        console.warn(
          `[KuzuToIgraphParsing] Non-numeric weight at edge ${i} (${e.source} -> ${e.target}); treated as 0.`
        );
      }
    }
  }

  const nodesAssigned = nextId;
  if (nodesNumber < nodesAssigned) {
    throw new Error(
      `Inconsistent graph: edge list references ${nodesAssigned} unique nodes, but only ${nodesNumber} declared.`
    );
  }
  const nodes = nodesAssigned;
  return { nodes, src, dst, directed, weight }; // Todo: test this
}

import createModule from "../graph";

import { KuzuToIgraphParsing } from "./utils/KuzuToIgraphConverter";
import type { KuzuToIgraphParseResult } from "./types/types";
import { igraphBFS, type BFSResult } from "./algorithms/PathFinding/IgraphBFS";
import { igraphDFS, type DFSResult } from "./algorithms/PathFinding/IgraphDFS";
import {
  igraphDijkstraAToB,
  type DijkstraAToBResult,
} from "./algorithms/PathFinding/IgraphDijkstraAtoB";
import {
  igraphDijkstraAToAll,
  type DijkstraAToAllResult,
} from "./algorithms/PathFinding/IgraphDijkstraAtoAll";
import { igraphYen, type YenResult } from "./algorithms/PathFinding/IgraphYen";
import {
  igraphBellmanFordAToB,
  type BellmanFordAToBResult,
} from "./algorithms/PathFinding/IgraphBellmanFordAtoB";
import {
  igraphBellmanFordAToAll,
  type BellmanFordAToAllResult,
} from "./algorithms/PathFinding/IgraphBellmanFordAToAll";
import {
  igraphRandomWalk,
  type RandomWalkResult,
} from "./algorithms/PathFinding/IgraphRandomWalk";

import type {
  EdgeSchema,
  GraphEdge,
  GraphNode,
  NodeSchema,
} from "~/features/visualizer/types";

export class IgraphController {
  private _wasmGraphModule: any = undefined;
  private _getKuzuData: () => Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
    nodeTables: NodeSchema[];
    edgeTables: EdgeSchema[];
  }>;
  private _getDirection: () => boolean;

  constructor(getKuzuData: () => Promise<any>, getDirection: () => boolean) {
    this._getDirection = getDirection;
    this._getKuzuData = getKuzuData;
  }

  // Initialize WASM module
  async initIgraph(): Promise<any> {
    if (!this._wasmGraphModule) {
      try {
        this._wasmGraphModule = await createModule();
      } catch (err) {
        console.error("Failed to load WASM module", err);
        throw new Error("Failed to load WASM module: " + err);
      }
    }
    return this._wasmGraphModule;
  }

  getIgraphModule(): any {
    return this._wasmGraphModule;
  }

  // Centralized data preparation - only called when needed
  private async _prepareGraphData(): Promise<KuzuToIgraphParseResult> {
    // JS call
    const kuzuData = await this._getKuzuData();
    const direction = this._getDirection();
    const parseResult = KuzuToIgraphParsing(
      kuzuData.nodes.length,
      kuzuData.edges,
      direction
    );
    const igraphInput = parseResult.IgraphInput;

    // Wasm call
    await this._wasmGraphModule.cleanupGraph();
    await this._wasmGraphModule.create_graph_from_kuzu_to_igraph(
      igraphInput.nodes,
      igraphInput.src,
      igraphInput.dst,
      igraphInput.directed,
      igraphInput.weight
    );

    return parseResult;
  }

  // ==========================================
  // TRAVERSAL & CONNECTIVITY ALGORITHMS
  // ==========================================

  async bfs(kuzuSourceID: string): Promise<BFSResult> {
    const graphData = await this._prepareGraphData();
    return await igraphBFS(this._wasmGraphModule, graphData, kuzuSourceID);
  }

  async dfs(kuzuSourceID: string): Promise<DFSResult> {
    const graphData = await this._prepareGraphData();
    return await igraphDFS(this._wasmGraphModule, graphData, kuzuSourceID);
  }

  // ==========================================
  // PATH & REACHABILITY ALGORITHMS
  // ==========================================

  async dijkstraAToB(start: string, end: string): Promise<DijkstraAToBResult> {
    const graphData = await this._prepareGraphData();
    return await igraphDijkstraAToB(
      this._wasmGraphModule,
      graphData,
      start,
      end
    );
  }

  async dijkstraAToAll(start: string): Promise<DijkstraAToAllResult> {
    const graphData = await this._prepareGraphData();
    return await igraphDijkstraAToAll(this._wasmGraphModule, graphData, start);
  }

  async bellmanFordAToB(start: string, end: string): Promise<BellmanFordAToBResult> {
    const graphData = await this._prepareGraphData();
    return await igraphBellmanFordAToB(
      this._wasmGraphModule,
      graphData,
      start,
      end
    );
  }

  async bellmanFordAToAll(start: string): Promise<BellmanFordAToAllResult> {
    const graphData = await this._prepareGraphData();
    return await igraphBellmanFordAToAll(this._wasmGraphModule, graphData, start);
  }

  async randomWalk(start: string, steps: number): Promise<RandomWalkResult> {
    const graphData = await this._prepareGraphData();
    return await igraphRandomWalk(this._wasmGraphModule, graphData, start, steps);
  }

  async yenKShortestPaths(
    start: string,
    end: string,
    k: number
  ): Promise<YenResult> {
    const graphData = await this._prepareGraphData();
    return await igraphYen(this._wasmGraphModule, graphData, start, end, k);
  }

  async minimumSpanningTree() {
    const graphData = await this._prepareGraphData();
    // return igraphMST(...);
    throw new Error("MST not implemented yet");
  }

  async graphDiameter() {
    const graphData = await this._prepareGraphData();
    // return igraphDiameter(...);
    throw new Error("Graph Diameter not implemented yet");
  }

  async eulerianPath() {
    const graphData = await this._prepareGraphData();
    // return igraphEulerianPath(...);
    throw new Error("Eulerian Path not implemented yet");
  }

  async eulerianCircuit() {
    const graphData = await this._prepareGraphData();
    // return igraphEulerianCircuit(...);
    throw new Error("Eulerian Circuit not implemented yet");
  }

  // ==========================================
  // CENTRALITY ALGORITHMS
  // ==========================================

  async betweennessCentrality() {
    const graphData = await this._prepareGraphData();
    // return igraphBetweennessCentrality(...);
    throw new Error("Betweenness Centrality not implemented yet");
  }

  async closenessCentrality() {
    const graphData = await this._prepareGraphData();
    // return igraphClosenessCentrality(...);
    throw new Error("Closeness Centrality not implemented yet");
  }

  async eigenvectorCentrality() {
    const graphData = await this._prepareGraphData();
    // return igraphEigenvectorCentrality(...);
    throw new Error("Eigenvector Centrality not implemented yet");
  }

  async pageRank() {
    const graphData = await this._prepareGraphData();
    // return igraphPageRank(...);
    throw new Error("PageRank not implemented yet");
  }

  // ==========================================
  // COMMUNITY DETECTION ALGORITHMS
  // ==========================================

  async louvainCommunities() {
    const graphData = await this._prepareGraphData();
    // return igraphLouvain(...);
    throw new Error("Louvain Communities not implemented yet");
  }

  async labelPropagation() {
    const graphData = await this._prepareGraphData();
    // return igraphLabelPropagation(...);
    throw new Error("Label Propagation not implemented yet");
  }

  // ==========================================
  // SIMILARITY & MATCHING ALGORITHMS
  // ==========================================

  async jaccardSimilarity() {
    const graphData = await this._prepareGraphData();
    // return igraphJaccard(...);
    throw new Error("Jaccard Similarity not implemented yet");
  }
}

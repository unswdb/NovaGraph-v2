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
import { igraphMST, type MSTResult } from "./algorithms/PathFinding/IgraphMST";
import {
  igraphBetweennessCentrality,
  type BetweennessCentralityResult,
} from "./algorithms/Centrality/IgraphBetweenessCentrality";
import {
  igraphClosenessCentrality,
  type ClosenessCentralityResult,
} from "./algorithms/Centrality/IgraphCloseCentrality";
import {
  igraphDegreeCentrality,
  type DegreeCentralityResult,
} from "./algorithms/Centrality/IgraphDegreeCentrality";
import {
  igraphEigenvectorCentrality,
  type EigenvectorCentralityResult,
} from "./algorithms/Centrality/IgraphEigenvectorCentrality";
import {
  igraphHarmonicCentrality,
  type HarmonicCentralityResult,
} from "./algorithms/Centrality/IgraphHarmonicCentrality";
import {
  igraphStrengthCentrality,
  type StrengthCentralityResult,
} from "./algorithms/Centrality/IgraphStrengthCentrality";
import {
  igraphPageRank,
  type PageRankResult,
} from "./algorithms/Centrality/IgraphPageRank";
import {
  igraphLouvain,
  type LouvainResult,
} from "./algorithms/Community/IgraphLouvain";
import {
  igraphLeiden,
  type LeidenResult,
} from "./algorithms/Community/IgraphLeiden";
import {
  igraphFastGreedy,
  type FastGreedyResult,
} from "./algorithms/Community/IgraphFastGreedy";
import {
  igraphLabelPropagation,
  type LabelPropagationResult,
} from "./algorithms/Community/IgraphLabelPropagation";
import {
  igraphLocalClusteringCoefficient,
  type LocalClusteringCoefficientResult,
} from "./algorithms/Community/IgraphLocalClusteringCoefficient";
import {
  igraphKCore,
  type KCoreResult,
} from "./algorithms/Community/IgraphKCore";
import {
  igraphTriangles,
  type TriangleCountResult,
} from "./algorithms/Community/IgraphTriangles";
import {
  igraphStronglyConnectedComponents,
  type SCCResult,
} from "./algorithms/Community/IgraphStronglyConnectedComponents";
import {
  igraphWeaklyConnectedComponents,
  type WCCResult,
} from "./algorithms/Community/IgraphWeaklyConnectedComponents";

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

  async stronglyConnectedComponents(): Promise<SCCResult> {
    const graphData = await this._prepareGraphData();
    return await igraphStronglyConnectedComponents(this._wasmGraphModule, graphData);
  }

  async weaklyConnectedComponents(): Promise<WCCResult> {
    const graphData = await this._prepareGraphData();
    return await igraphWeaklyConnectedComponents(this._wasmGraphModule, graphData);
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

  async minimumSpanningTree(): Promise<MSTResult> {
    const graphData = await this._prepareGraphData();
    return await igraphMST(this._wasmGraphModule, graphData);
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

  async betweennessCentrality(): Promise<BetweennessCentralityResult> {
    const graphData = await this._prepareGraphData();
    return await igraphBetweennessCentrality(this._wasmGraphModule, graphData);
  }

  async closenessCentrality() {
    const graphData = await this._prepareGraphData();
    return await igraphClosenessCentrality(this._wasmGraphModule, graphData);
  }

  async degreeCentrality(): Promise<DegreeCentralityResult> {
    const graphData = await this._prepareGraphData();
    return await igraphDegreeCentrality(this._wasmGraphModule, graphData);
  }

  async eigenvectorCentrality() {
    const graphData = await this._prepareGraphData();
    return await igraphEigenvectorCentrality(this._wasmGraphModule, graphData);
  }

  async harmonicCentrality(): Promise<HarmonicCentralityResult> {
    const graphData = await this._prepareGraphData();
    return await igraphHarmonicCentrality(this._wasmGraphModule, graphData);
  }

  async strengthCentrality(): Promise<StrengthCentralityResult> {
    const graphData = await this._prepareGraphData();
    return await igraphStrengthCentrality(this._wasmGraphModule, graphData);
  }

  async pageRank(damping: number): Promise<PageRankResult> {
    const graphData = await this._prepareGraphData();
    return await igraphPageRank(this._wasmGraphModule, graphData, damping);
  }

  // ==========================================
  // COMMUNITY DETECTION ALGORITHMS
  // ==========================================

  async louvainCommunities(resolution: number): Promise<LouvainResult> {
    const graphData = await this._prepareGraphData();
    return await igraphLouvain(this._wasmGraphModule, graphData, resolution);
  }

  async leidenCommunities(resolution: number): Promise<LeidenResult> {
    const graphData = await this._prepareGraphData();
    return await igraphLeiden(this._wasmGraphModule, graphData, resolution);
  }

  async fastGreedyCommunities(): Promise<FastGreedyResult> {
    const graphData = await this._prepareGraphData();
    return await igraphFastGreedy(this._wasmGraphModule, graphData);
  }

  async labelPropagation(): Promise<LabelPropagationResult> {
    const graphData = await this._prepareGraphData();
    return await igraphLabelPropagation(this._wasmGraphModule, graphData);
  }

  async localClusteringCoefficient(): Promise<LocalClusteringCoefficientResult> {
    const graphData = await this._prepareGraphData();
    return await igraphLocalClusteringCoefficient(this._wasmGraphModule, graphData);
  }

  async kCore(k: number): Promise<KCoreResult> {
    const graphData = await this._prepareGraphData();
    return await igraphKCore(this._wasmGraphModule, graphData, k);
  }

  async triangles(): Promise<TriangleCountResult> {
    const graphData = await this._prepareGraphData();
    return await igraphTriangles(this._wasmGraphModule, graphData);
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

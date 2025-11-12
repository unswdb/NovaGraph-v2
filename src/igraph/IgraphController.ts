import { toast } from "sonner";

import createModule from "../graph";

import type { GraphModule, KuzuToIgraphParseResult } from "./types";
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
import {
  igraphVerticesAreAdjacent,
  type VerticesAreAdjacentResult,
} from "./algorithms/Misc/IgraphVerticesAreAdjacent";
import {
  igraphTopologicalSort,
  type TopologicalSortResult,
} from "./algorithms/Misc/IgraphTopologicalSort";
import {
  igraphDiameter,
  type GraphDiameterResult,
} from "./algorithms/Misc/IgraphDiameter";
import {
  igraphEulerianPath,
  type EulerianPathResult,
} from "./algorithms/Misc/IgraphEulerianPath";
import {
  igraphEulerianCircuit,
  type EulerianCircuitResult,
} from "./algorithms/Misc/IgraphEulerianCircuit";
import {
  igraphMissingEdgePrediction,
  type MissingEdgePredictionResult,
} from "./algorithms/Misc/IgraphMissingEdgePrediction";
import {
  igraphJaccardSimilarity,
  type JaccardSimilarityResult,
} from "./algorithms/Misc/IgraphJaccardSimilarity";
import { parseKuzuToIgraphInput } from "./utils/parseKuzuToIgraphInput";

import type {
  EdgeSchema,
  GraphEdge,
  GraphNode,
  NodeSchema,
} from "~/features/visualizer/types";

type InitializedIgraphController = IgraphController & {
  _wasmGraphModule: NonNullable<IgraphController["_wasmGraphModule"]>;
};

export class IgraphController {
  protected _wasmGraphModule: GraphModule | null = null;
  private _getKuzuData: () => Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
    nodeTables: NodeSchema[];
    edgeTables: EdgeSchema[];
  }>;
  private _getDirection: () => boolean;

  constructor(
    getKuzuData: () => Promise<{
      nodes: GraphNode[];
      edges: GraphEdge[];
      nodeTables: NodeSchema[];
      edgeTables: EdgeSchema[];
    }>,
    getDirection: () => boolean
  ) {
    this._getDirection = getDirection;
    this._getKuzuData = getKuzuData;
  }

  // Initialize WASM module
  async initIgraph(): Promise<GraphModule> {
    if (!this._wasmGraphModule) {
      try {
        this._wasmGraphModule = await createModule();
      } catch (err) {
        throw new Error("Failed to load WASM module: " + err);
      }
    }
    return this._wasmGraphModule;
  }

  getIgraphModule(): GraphModule | null {
    return this._wasmGraphModule;
  }

  // Centralized data preparation - only called when needed
  private async _prepareGraphData(): Promise<KuzuToIgraphParseResult> {
    this.checkInitialization();

    const kuzuData = await this._getKuzuData();
    const direction = this._getDirection();
    const parseResult = parseKuzuToIgraphInput(
      kuzuData.nodes,
      kuzuData.edges,
      direction
    );

    const igraphInput = parseResult.IgraphInput;
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

  // @ts-ignore: used via side-effecting calls
  private _assertsDirected(): asserts this {
    if (!this._getDirection()) {
      throw new Error("This algorithm requires a directed graph");
    }
  }

  private async _prepareGraphDataWithoutDirection(): Promise<KuzuToIgraphParseResult> {
    this.checkInitialization();

    const directed = this._getDirection();
    if (directed) {
      // eslint-disable-next-line no-console
      console.warn(
        "Directed graph converted to undirected for this operation only"
      );
      toast.warning(
        "Directed graph converted to undirected for this operation only"
      );
    }

    const kuzuData = await this._getKuzuData();
    const parseResult = parseKuzuToIgraphInput(
      kuzuData.nodes,
      kuzuData.edges,
      false
    );

    const igraphInput = parseResult.IgraphInput;
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
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphBFS(this._wasmGraphModule, graphData, kuzuSourceID);
  }

  async dfs(kuzuSourceID: string): Promise<DFSResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphDFS(this._wasmGraphModule, graphData, kuzuSourceID);
  }

  async stronglyConnectedComponents(): Promise<SCCResult> {
    this.checkInitialization();

    this._assertsDirected();

    const graphData = await this._prepareGraphData();
    return await igraphStronglyConnectedComponents(
      this._wasmGraphModule,
      graphData
    );
  }

  async weaklyConnectedComponents(): Promise<WCCResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphWeaklyConnectedComponents(
      this._wasmGraphModule,
      graphData
    );
  }

  async verticesAreAdjacent(
    source: string,
    target: string
  ): Promise<VerticesAreAdjacentResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphVerticesAreAdjacent(
      this._wasmGraphModule,
      graphData,
      source,
      target
    );
  }

  async topologicalSort(): Promise<TopologicalSortResult> {
    this.checkInitialization();

    this._assertsDirected();

    const graphData = await this._prepareGraphData();
    return await igraphTopologicalSort(this._wasmGraphModule, graphData);
  }

  // ==========================================
  // PATH & REACHABILITY ALGORITHMS
  // ==========================================

  async dijkstraAToB(start: string, end: string): Promise<DijkstraAToBResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphDijkstraAToB(
      this._wasmGraphModule,
      graphData,
      start,
      end
    );
  }

  async dijkstraAToAll(start: string): Promise<DijkstraAToAllResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphDijkstraAToAll(this._wasmGraphModule, graphData, start);
  }

  async bellmanFordAToB(
    start: string,
    end: string
  ): Promise<BellmanFordAToBResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphBellmanFordAToB(
      this._wasmGraphModule,
      graphData,
      start,
      end
    );
  }

  async bellmanFordAToAll(start: string): Promise<BellmanFordAToAllResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphBellmanFordAToAll(
      this._wasmGraphModule,
      graphData,
      start
    );
  }

  async randomWalk(start: string, steps: number): Promise<RandomWalkResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphRandomWalk(
      this._wasmGraphModule,
      graphData,
      start,
      steps
    );
  }

  async yenKShortestPaths(
    start: string,
    end: string,
    k: number
  ): Promise<YenResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphYen(this._wasmGraphModule, graphData, start, end, k);
  }

  async minimumSpanningTree(): Promise<MSTResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphMST(this._wasmGraphModule, graphData);
  }

  async graphDiameter(): Promise<GraphDiameterResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphDiameter(this._wasmGraphModule, graphData);
  }

  async eulerianPath(): Promise<EulerianPathResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphEulerianPath(this._wasmGraphModule, graphData);
  }

  async eulerianCircuit(): Promise<EulerianCircuitResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphEulerianCircuit(this._wasmGraphModule, graphData);
  }

  // ==========================================
  // CENTRALITY ALGORITHMS
  // ==========================================

  async betweennessCentrality(): Promise<BetweennessCentralityResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphBetweennessCentrality(this._wasmGraphModule, graphData);
  }

  async closenessCentrality(): Promise<ClosenessCentralityResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphClosenessCentrality(this._wasmGraphModule, graphData);
  }

  async degreeCentrality(): Promise<DegreeCentralityResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphDegreeCentrality(this._wasmGraphModule, graphData);
  }

  async eigenvectorCentrality(): Promise<EigenvectorCentralityResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphEigenvectorCentrality(this._wasmGraphModule, graphData);
  }

  async harmonicCentrality(): Promise<HarmonicCentralityResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphHarmonicCentrality(this._wasmGraphModule, graphData);
  }

  async strengthCentrality(): Promise<StrengthCentralityResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphStrengthCentrality(this._wasmGraphModule, graphData);
  }

  async pageRank(damping: number): Promise<PageRankResult> {
    this.checkInitialization();

    this._assertsDirected();

    const graphData = await this._prepareGraphData();
    return await igraphPageRank(this._wasmGraphModule, graphData, damping);
  }

  // ==========================================
  // COMMUNITY DETECTION ALGORITHMS
  // ==========================================

  async louvainCommunities(resolution: number): Promise<LouvainResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphLouvain(this._wasmGraphModule, graphData, resolution);
  }

  async leidenCommunities(resolution: number): Promise<LeidenResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphLeiden(this._wasmGraphModule, graphData, resolution);
  }

  async fastGreedyCommunities(): Promise<FastGreedyResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphFastGreedy(this._wasmGraphModule, graphData);
  }

  async labelPropagation(): Promise<LabelPropagationResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphLabelPropagation(this._wasmGraphModule, graphData);
  }

  async localClusteringCoefficient(): Promise<LocalClusteringCoefficientResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphLocalClusteringCoefficient(
      this._wasmGraphModule,
      graphData
    );
  }

  async kCore(k: number): Promise<KCoreResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphKCore(this._wasmGraphModule, graphData, k);
  }

  async triangles(): Promise<TriangleCountResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphTriangles(this._wasmGraphModule, graphData);
  }

  // ==========================================
  // SIMILARITY & MATCHING ALGORITHMS
  // ==========================================

  async jaccardSimilarity(nodes: string[]): Promise<JaccardSimilarityResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphData();
    return await igraphJaccardSimilarity(
      this._wasmGraphModule,
      graphData,
      nodes
    );
  }

  async missingEdgePrediction(
    sampleSize: number,
    numBins: number
  ): Promise<MissingEdgePredictionResult> {
    this.checkInitialization();

    const graphData = await this._prepareGraphDataWithoutDirection();
    return await igraphMissingEdgePrediction(
      this._wasmGraphModule,
      graphData,
      sampleSize,
      numBins
    );
  }

  protected checkInitialization(): asserts this is InitializedIgraphController {
    if (!this._wasmGraphModule) {
      throw new Error("WASM module is not initialized");
    }
  }
}

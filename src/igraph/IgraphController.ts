import createModule from "../graph"
import { KuzuToIgraphParsing } from "./utils/KuzuToIgraphConverter";
import type { KuzuToIgraphParseResult } from "./types/types";
import { igraphBFS } from "./algorithms/PathFinding/IgraphBFS";

export class IgraphController {
    private _wasmGraphModule: any = undefined;
    private _getKuzuData: () => Promise<any>; 
    private _getDirection: () => boolean; 

    constructor(
      getKuzuData: () => Promise<any>,
      getDirection: () => boolean
    ) {
      console.log("Constructor for Igraph")
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
        const kuzuData = await this._getKuzuData();
        const direction = this._getDirection();
        return KuzuToIgraphParsing(kuzuData.nodes.length, kuzuData.edges, direction);
    }

    // ==========================================
    // TRAVERSAL & CONNECTIVITY ALGORITHMS
    // ==========================================
    
    async bfs() {
        const graphData = await this._prepareGraphData();
        return igraphBFS(
            this._wasmGraphModule,
            graphData.IgraphInput,
            graphData.IgraphToKuzuMap
        );
    }

    async dfs() {
        const graphData = await this._prepareGraphData();
        // return igraphDFS(this._wasmGraphModule, graphData.IgraphInput, graphData.IgraphToKuzuMap);
        throw new Error("DFS not implemented yet");
    }

    // ==========================================
    // PATH & REACHABILITY ALGORITHMS
    // ==========================================
    
    async dijkstraAToB(start: string, end: string) {
        const graphData = await this._prepareGraphData();
        // return igraphDijkstraAToB(
        //     this._wasmGraphModule, 
        //     graphData.IgraphInput, 
        //     graphData.IgraphToKuzuMap,
        //     start,
        //     end
        // );
        throw new Error("Dijkstra A to B not implemented yet");
    }

    async dijkstraAToAll(start: string) {
        const graphData = await this._prepareGraphData();
        // return igraphDijkstraAToAll(...);
        throw new Error("Dijkstra A to All not implemented yet");
    }

    async bellmanFordAToB(start: string, end: string) {
        const graphData = await this._prepareGraphData();
        // return igraphBellmanFordAToB(...);
        throw new Error("Bellman-Ford A to B not implemented yet");
    }

    async bellmanFordAToAll(start: string) {
        const graphData = await this._prepareGraphData();
        // return igraphBellmanFordAToAll(...);
        throw new Error("Bellman-Ford A to All not implemented yet");
    }

    async yenKShortestPaths(start: string, end: string, k: number) {
        const graphData = await this._prepareGraphData();
        // return igraphYen(...);
        throw new Error("Yen's K-Shortest Paths not implemented yet");
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
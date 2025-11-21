## IgraphController.ts — Role, Structure, Data Flow, Extensibility

- Role: Bridge between Kuzu graph state and WASM (C++ igraph). It:
  - Initializes and holds the WASM module
  - Transforms Kuzu snapshots into dense arrays for WASM
  - Rebuilds the global graph state in WASM on-demand
  - Exposes graph algorithms with type-safe results

### Folder structure (`src/igraph/`)

```
igraph/
|- IgraphController.ts          # Orchestrates data prep + algorithm calls
|- types.ts                     # Types for module/inputs/results
|- utils/
|  |- parseKuzuToIgraphInput.ts # Converts Kuzu snapshot => arrays for WASM
|- algorithms/
   |- Centrality/               # Centrality wrappers (PageRank, etc.)
   |- Community/                # Communities (Louvain, Leiden, etc.)
   |- Misc/                     # Utilities (SCC/WCC, topo sort, etc.)
   |- PathFinding/              # BFS/DFS/Dijkstra/Yen/etc.
```

### Key responsibilities in controller
- Initialization
  - `initIgraph()`: loads WASM module via `createModule()`
  - `getIgraphModule()`: returns module or `null`
- Data preparation
  - `_prepareGraphData()`: reads Kuzu snapshot + uses `parseKuzuToIgraphInput`
  - Calls `cleanupGraph()` then `create_graph_from_kuzu_to_igraph(...)` in WASM
  - `_prepareGraphDataWithoutDirection()`: converts to undirected for specific algos
- Safety
  - `checkInitialization()`: ensure WASM is ready
  - `_assertsDirected()`: guard for directed-only algorithms
- Algorithms
  - Traversal/connectivity, path/reachability, centrality, community, misc wrappers

### Data flow (high-level)

Kuzu snapshotGraphState -> IgraphController
IgraphController -> parseKuzuToIgraphInput
parseKuzuToIgraphInput -> cleanupGraph()
cleanupGraph() -> create_graph_from_kuzu_to_igraph(...)
create_graph_from_kuzu_to_igraph(...) -> Algorithm call (WASM)
Algorithm call (WASM) -> Typed result

Notes:
- Some algorithms require directed graphs; others temporarily coerce to undirected for computation.
- Rebuilding happens before each algorithm call to reflect current DB state.

### Add a new algorithm (TypeScript side)
1. Bindings/types
   - Add any missing WASM function type to `src/igraph/types.ts` if needed.
2. Wrapper
   - Create a wrapper under `src/igraph/algorithms/<Category>/YourAlgo.ts` that:
     - Accepts `(GraphModule, parsedGraphData, ...params)`
     - Invokes the underlying WASM function
     - Returns a typed result
     - See src/igraph/algorithms/example.txt and other files in folder for examples
3. Controller method
   - Add a method to `IgraphController` that:
     - `checkInitialization()`
     - Prepares graph data via `_prepareGraphData()` or `_prepareGraphDataWithoutDirection()`
     - Delegates to your wrapper and returns the result

For WASM-side algorithm guidance, see `../wasm/README.md`.



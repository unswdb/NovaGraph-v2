# Igraph Module Architecture

> **Graph Algorithm Integration Layer**  
> A TypeScript wrapper around the igraph WASM module for running high-performance graph algorithms on Kuzu database snapshots.

---

## 📁 Folder Structure

```
src/igraph/
├── README.md                      # Architecture documentation (this file)
├── IgraphController.ts            # Main controller class
├── algorithms/
│   ├── example.txt                # Tutorial for adding new algorithms
│   └── PathFinding/
│       └── IgraphBFS.ts          # BFS implementation (reference)
├── types/
│   └── types.ts                  # Core type definitions
├── utils/
│   └── KuzuToIgraphConverter.ts  # Data transformation utilities
└── doc/                          # Future documentation
```

---

## 🏗️ Architecture Overview

### Data Flow Pipeline

```
Kuzu Database → IgraphController → Data Converter → WASM Module → Algorithm → Result Parser → Frontend
```

1. **MainController** initializes `IgraphController` with Kuzu data access
2. **IgraphController** orchestrates algorithm execution
3. **KuzuToIgraphConverter** transforms graph data into WASM-compatible format
4. **Algorithm modules** execute and parse results
5. Results are returned to the frontend with Kuzu IDs restored

---

## 🎯 Core Components

### 1. IgraphController (`IgraphController.ts`)

**Responsibilities:**
- Initialize and manage the WASM module lifecycle
- Prepare graph data before algorithm execution
- Expose algorithm APIs to MainController
- Handle data conversion between Kuzu and Igraph formats

**Key Methods:**
```typescript
// Initialization
async initIgraph(): Promise<any>
getIgraphModule(): any

// Internal data preparation
private async _prepareGraphData(): Promise<KuzuToIgraphParseResult>

// Algorithm categories (see below)
```

**Algorithm Categories:**

| Category | Methods | Status |
|----------|---------|--------|
| **Traversal & Connectivity** | `bfs()`, `dfs()` | BFS ✅ |
| **Path & Reachability** | `dijkstraAToB()`, `bellmanFord*()`, `yenKShortestPaths()`, `minimumSpanningTree()`, etc. | Planned 🔜 |
| **Centrality** | `betweennessCentrality()`, `pageRank()`, etc. | Planned 🔜 |
| **Community Detection** | `louvainCommunities()`, `labelPropagation()` | Planned 🔜 |
| **Similarity & Matching** | `jaccardSimilarity()` | Planned 🔜 |

---

### 2. Data Converter (`utils/KuzuToIgraphConverter.ts`)

**Purpose:** Transforms Kuzu graph data into igraph WASM-compatible format

**Core Function:**
```typescript
KuzuToIgraphParsing(
  nodesNumber: number,
  edges: GraphEdge[],
  directed: boolean
): KuzuToIgraphParseResult
```

**Outputs:**
- `IgraphInput`: WASM-ready data (Int32Arrays for edges, Float64Array for weights)
- `KuzuToIgraphMap`: Kuzu ID → Igraph numeric ID
- `IgraphToKuzuMap`: Reverse mapping for result translation

**Safety Features:**
- 32-bit signed integer validation (igraph WASM constraint)
- Weighted edge handling with fallback to 0
- Isolated node detection and warnings

---

### 3. Types (`types/types.ts`)

**Core Types:**

```typescript
// Input format for WASM module
type IgraphInput = {
  nodes: number;
  src: Int32Array;
  dst: Int32Array;
  directed: boolean;
  weight?: Float64Array | Float32Array;
}

// Conversion result with ID mappings
type KuzuToIgraphParseResult = {
  IgraphInput: IgraphInput;
  KuzuToIgraphMap: Map<string, number>;
  IgraphToKuzuMap: Map<number, string>;
}
```

---

### 4. Algorithm Modules (`algorithms/`)

**Standard Algorithm Pattern:**

Each algorithm follows a consistent 3-function structure:

```typescript
// 1. Execute WASM algorithm
async function _runIgraphAlgo(igraphMod, ...params)

// 2. Parse and map results back to Kuzu IDs
function _parseResult(IgraphToKuzu, algorithmResult)

// 3. Public API combining both steps
export async function igraph{AlgorithmName}(
  igraphMod,
  graphData,
  ...params
): Promise<AlgorithmResult>
```

**👉 See [`algorithms/example.txt`](./algorithms/example.txt) for a complete tutorial**

---

## 🔄 Integration with MainController

```typescript
// src/MainController.ts
class MainController {
  private _IgraphController: IgraphController;

  constructor() {
    this._IgraphController = new IgraphController(
      this.db.snapshotGraphState,  // Kuzu data access
      this.db.getGraphDirection     // Graph direction flag
    );
  }

  async initSystem() {
    await this.initKuzu();
    await this.initIgraph();
  }

  getAlgorithm() {
    return this._IgraphController;
  }
}
```

**Usage Example:**
```typescript
// From frontend/service layer
const controller = new MainController();
await controller.initSystem();

const igraph = controller.getAlgorithm();
const result = await igraph.bfs("node_id_123");
```

---

## 📝 Adding a New Algorithm

**Quick Start:** See [`algorithms/example.txt`](./algorithms/example.txt)

**Steps:**
1. Create `algorithms/{Category}/Igraph{AlgorithmName}.ts`
2. Define result types
3. Implement the 3-function pattern:
   - `_runIgraphAlgo()` - WASM execution
   - `_parseResult()` - ID mapping
   - `igraph{AlgorithmName}()` - Public API
4. Import and add method in `IgraphController`
5. Test with Kuzu data

---

## 🎨 Design Principles

1. **Separation of Concerns**
   - Controller = Orchestration
   - Converter = Data transformation
   - Algorithms = Domain logic

2. **ID Mapping Transparency**
   - Frontend always works with Kuzu IDs
   - Igraph numeric IDs are internal implementation details

3. **Lazy Initialization**
   - WASM module loaded only once on first use
   - Graph data prepared on-demand per algorithm call

4. **Type Safety**
   - Strong TypeScript types throughout
   - Validated conversions with runtime checks

5. **Extensibility**
   - New algorithms follow standardized pattern
   - Categories organize related algorithms
   - Consistent return structures

---

## 🚀 Future Enhancements

- [ ] Algorithm result caching
- [ ] Batch algorithm execution
- [ ] Progress callbacks for long-running algorithms
- [ ] Algorithm-specific optimizations
- [ ] Comprehensive test suite
- [ ] Performance benchmarking

---

## 📚 References

- **Tutorial:** [`algorithms/example.txt`](./algorithms/example.txt)
- **Example Implementation:** [`algorithms/PathFinding/IgraphBFS.ts`](./algorithms/PathFinding/IgraphBFS.ts)
- **Main Integration:** [`../MainController.ts`](../MainController.ts)


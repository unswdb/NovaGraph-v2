# Contains C++ files and libraries

## igraph
NovaGraph uses the igraph C library for graph analytics and computations. To build, the igraph library needs to be built locally. The igraph library is not being tracked but can be built for WebAssembly with Emscripten and cmake installed:

```bash
cd src/wasm
git clone https://github.com/igraph/igraph.git
mkdir igraph/build
cd igraph/build
emcmake cmake ..
cmake --build .
```

One of the problems I ran into was the "TestEndianess" check. To fix this, I had to add the line `SET(CMAKE_16BIT_TYPE "unsigned short")` in the file "/usr/share/cmake-3.28/Modules/TestBigEndian.cmake".

Other problems may also pop up during the build which may require certain programs to be installed or small file modifications like the above to bypass. These will depend on what has been written in the library's `CMakeLists.txt` file.

## RapidJSON
Make sure the RapidJSON git repository is cloned.
```bash
git clone https://github.com/Tencent/rapidjson.git
```
This doesn't need CMake to use since its a header only library

---

## wasm/graph.cpp — Role, Structure, Data Flow, Extensibility

- Role: C++ igraph core compiled to WASM. Maintains a global in-memory graph (`globalGraph` + `globalWeights`) and exposes algorithms to JS/TS via Embind.

### Folder structure (`src/wasm/`)

```
wasm/
|- graph.cpp                 # Implementations + EMSCRIPTEN_BINDINGS
|- graph.h                   # Declarations + extern globals
|- igraph_wrappers.h         # RAII wrappers for igraph types
|- algorithms/               # Algorithm-specific code (linked/used within)
|- generators/               # Graph generators (e.g., for demos/tests)
|- other.cpp, map.cpp        # Support code
```

### Important functions
- `create_graph_from_kuzu_to_igraph(nodes, src, dst, directed, weight?)`
  - Re-initializes `globalGraph` with given vertex count, adds edges in batch, and (optionally) assigns edge weights into `globalWeights` and sets `"weight"` attribute.
  - Effect: replaces the overall global graph state used by all subsequent algorithms.
- `cleanupGraph()`
  - Destroys `globalGraph` and `globalWeights`.
- `EMSCRIPTEN_BINDINGS(graph)`
  - Exposes all functions to JS/TS (BFS/DFS/Dijkstra/PageRank/etc., plus `create_graph_from_kuzu_to_igraph`, `cleanupGraph`).

### Data flow (high-level)

TS arrays from IgraphController -> create_graph_from_kuzu_to_igraph
create_graph_from_kuzu_to_igraph -> globalGraph/globalWeights
globalGraph/globalWeights -> Algorithm fn calls
Algorithm fn calls -> JS/TS results

Notes:
- The error handler throws C++ exceptions instead of aborting, caught on the JS side.
- Edges are batched via `igraph_vector_int_t` for performance.

### Add a new algorithm (C++ side)
1. Implement a function using `globalGraph` (e.g., `val my_algo(...)`) that returns an `emscripten::val`.
2. Declare it in `graph.h` if shared, or keep local if only used in `graph.cpp`.
3. Bind it in `EMSCRIPTEN_BINDINGS(graph)` as `function("my_algo", &my_algo);`
4. Rebuild the WASM module.
5. Wire into TS: add a typed wrapper and a method in `IgraphController` (see `../igraph/README.md`).

### Pointers to more detail
- Data preparation: `../igraph/README.md`
- Consumers and orchestration: `../README.md`

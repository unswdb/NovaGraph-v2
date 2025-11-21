## NovaGraph v2 — High-Level Architecture

This is a concise overview. Each layer links to a local, detailed doc beside the code.

### Layers and flow

UI / Features -> MainController
MainController -> KuzuController
MainController -> IgraphController
IgraphController -> WASM (igraph C++)

- `src/MainController.ts` — Orchestrates init, exposes DB API and algorithms
  - Details: `../src/MainController.DOCS.md`
- `src/kuzu/KuzuController.ts` — Facade over storage services (in-memory/persistent; sync/async)
  - Details: `../src/kuzu/KuzuController.DOCS.md`
- `src/igraph/IgraphController.ts` — Prepares data and calls WASM algorithms
  - Details: `../src/igraph/IgraphController.DOCS.md`
- `src/wasm/graph.cpp` — C++ igraph core compiled to WASM with global graph state
  - Details: `../src/wasm/graph.DOCS.md`

### Key data handoffs
- Kuzu snapshot -> arrays -> WASM graph rebuild
- Directedness enforced in `IgraphController` for specific algorithms
- WASM results mapped back to typed TS structures

### Folder trees

```
src/
|- MainController.ts
|- igraph/
|- kuzu/
|- wasm/
```

See each layer’s local doc for a deeper breakdown.



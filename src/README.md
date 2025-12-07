## MainController.ts — Role, Structure, Data Flow

- Role: Orchestrates system initialization and exposes two main capabilities:
  - Database operations via `kuzuController` (see `kuzu/README.md` for details)
  - Graph analytics via `IgraphController` + WASM (see `igraph/README.md`)

### Section breakdown inside MainController
- Private sector
  - `_IgraphController`: lazy-initialized `IgraphController` instance
  - `_initKuzu()`: initialize Kuzu (persistent/async in current setup)
  - `_initIgraph()`: initialize WASM module through `IgraphController`
- Public sector
  - `constructor()`: wires `IgraphController` with `db.snapshotGraphState` and `db.getGraphDirection`
  - `getGraphModule()`: returns current WASM module (if initialized)
  - `initSystem()`: sequentially initializes Kuzu then iGraph/WASM
  - `getAlgorithm()`: returns the `IgraphController`
- `db` namespace (delegation surface for Kuzu)
  - Schema: `createNodeSchema`, `createSchema`, `createEdgeSchema`
  - Data: `createNode`, `updateNode`, `deleteNode`, `createEdge`, `updateEdge`, `deleteEdge`
  - Querying/Metadata: `executeQuery`, `getColumnTypes`, `snapshotGraphState`
  - Persistence ops: `createDatabase`, `deleteDatabase`, `listDatabases`, `connectToDatabase`, `getCurrentDatabaseName`, `saveDatabase`, `loadDatabase`
  - Virtual FS: `writeVirtualFile`, `deleteVirtualFile`
- `_internal` namespace
  - Schema inspection helpers: `getSingleSchemaProperties`, `getAllSchemaProperties`

### Usage (singleton)
- Singleton instance exported as `controller`. Frontend usage:

```ts
import { controller } from "./MainController";

await controller.initSystem();

// DB usage
await controller.db.createNode("Person", { name: { value: "Alice" } });

// Algorithms usage
const algo = controller.getAlgorithm();
const bfs = await algo.bfs("someNodeId");
```

### Data flow (high-level)

UI/Features -> MainController

MainController -> KuzuController

MainController -> IgraphController

IgraphController -> igraph WASM

Notes:
- `db.snapshotGraphState()` feeds `IgraphController` to rebuild WASM graph state as needed.
- Direction flag comes from `db.getGraphDirection()`; algorithms that require directed graphs enforce it in `IgraphController`.

### Pointers to more detail
- Database facade and storage modes: see `kuzu/README.md`
- Graph algorithms, data preparation, and WASM: see `igraph/README.md`



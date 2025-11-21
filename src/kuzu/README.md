## KuzuController.ts — Role, Structure, Data Flow

- Role: Facade over Kuzu backing services. Normalizes type/mode, selects the appropriate service, and proxies all DB operations with consistent API surface.
- Modes:
  - Type: `inmemory` vs `persistent`
  - Mode: `sync` vs `async`
  - Selection is normalized and performed in `initialize(type, mode, options)`.

### Folder structure (`src/kuzu/`)

```
kuzu/
|- controllers/
|  |- KuzuController.ts        # Facade + lifecycle + proxies
|- services/                   # Concrete service implementations
|- helpers/                    # Utilities for Kuzu operations
|- types/                      # Kuzu type definitions, CompositeType, etc.
|- constants/                  # Kuzu-related constants
```

### Key responsibilities
- Lifecycle:
  - `initialize(type, mode, options)`: create and init chosen service.
  - `cleanup()`: dispose current service.
- Querying:
  - `executeQuery`, `getColumnTypes`, `snapshotGraphState`
- Schema:
  - `createSchema`, `createNodeSchema`, `createEdgeSchema`
- Data CRUD:
  - `createNode`, `updateNode`, `deleteNode`
  - `createEdge`, `updateEdge`, `deleteEdge`
- Persistence (persistent modes only):
  - `createDatabase`, `deleteDatabase`, `renameDatabase`
  - `connectToDatabase`, `disconnectFromDatabase`
  - `listDatabases`, `getCurrentDatabaseName`, `getCurrentDatabaseMetadata`
  - `saveDatabase` (IDBFS), `loadDatabase` (IDBFS), `clearAllDatabases`
- Virtual FS (if supported by service):
  - `writeVirtualFile`, `deleteVirtualFile`
- Introspection & mode checks:
  - `isPersistentMode`, `isInMemoryMode`, `isAsyncMode`, `isSyncMode`

### Usage (singleton)
- Singleton instance exported as default `kuzuController`. Frontend usage:

```ts
import kuzuController from "../kuzu/controllers/KuzuController";

await kuzuController.initialize("persistent", "async", {});

// Query
const result = await kuzuController.executeQuery("MATCH (n) RETURN n LIMIT 10");

// Snapshot for analytics
const snapshot = kuzuController.snapshotGraphState();
```

### Data flow (high-level)

MainController -> KuzuController
KuzuController -> Select Service (type/mode)
Select Service (type/mode) -> Service Impl
Service Impl -> snapshotGraphState
KuzuController -> MainController

Notes:
- `snapshotGraphState()` provides `nodes/edges/tables` to analytics (via `MainController` -> `IgraphController`).
- Persistent services add IDBFS save/load and DB management; in-memory services omit those.

### Pointers to more detail
- Orchestration and consumers: see `../README.md`
- Graph analytics pathway using snapshots: see `../igraph/README.md`



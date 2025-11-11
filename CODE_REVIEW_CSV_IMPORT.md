## File: `src/features/visualizer/import/implementations/csv.tsx`

### ❌ Line 181: Redundant Import

```typescript
const kuzu = await import("kuzu-wasm/sync");
```

**Issue:** This import is redundant. `kuzu-wasm/sync` is already imported in `KuzuInMemorySync.ts` at line 2.

**Why it's wrong:** UI layer should never import low-level database modules directly.

**Solution:** Remove this line. Access filesystem through service layer methods.

---

### ❌ Lines 183-393: Business Logic in UI Handler

**Issue:** 210+ lines of business logic (CSV parsing, type inference, schema creation, bulk loading) are in the UI handler.

**Why it's wrong:** 
- UI layer should only handle user input and display
- Business logic should be in service layer
- This makes the code not reusable
- Can't test without UI components

**Breakdown by responsibility:**

#### Lines 186-200: CSV Parsing
```typescript
const nodesText = await nodesFile.text();
const edgesText = await edgesFile.text();

const nodesLines = nodesText.trim().split("\n");
const edgesLines = edgesText.trim().split("\n");

const nodesHeader = nodesLines[0].trim();
const nodeColumns = nodesHeader.split(",").map(col => col.trim());

const edgesHeader = edgesLines[0].trim();
const edgeColumns = edgesHeader.split(",").map(col => col.trim());
const hasWeight = edgeColumns.includes("weight");
```

**Where it should be:** `KuzuBaseService.importFromCSV()` - This is CSV processing business logic, not UI logic.

---

#### Lines 209-226: VFS Operations
```typescript
const fs = kuzu.default.getFS();
const tempDir = '/tmp';

try {
  fs.mkdir(tempDir);
} catch (e) {
  // Directory might already exist, ignore error
}

const nodesPath = `${tempDir}/nodes_${Date.now()}.csv`;
const edgesPath = `${tempDir}/edges_${Date.now()}.csv`;

fs.writeFile(nodesPath, nodesText);
fs.writeFile(edgesPath, edgesText);
```

**Where it should be:** `KuzuBaseService.importFromCSV()` using `this.getFileSystem()` abstract method.

**Why:** Virtual filesystem operations are database implementation details, not UI concerns.

---

#### Lines 228-277: Type Inference Logic
```typescript
const primaryKeyColumn = nodeColumns[0];

console.log(`[CSV Import] Primary key: ${primaryKeyColumn}`);
console.log(`[CSV Import] Inferring types for columns:`, nodeColumns);

const typeInferenceQuery = `
  LOAD FROM '${nodesPath}' (header = true)
  RETURN ${nodeColumns.join(', ')}
  LIMIT 1
`;

const columnTypes = controller.db.getColumnTypes(typeInferenceQuery);

const inferredTypes: Record<string, ...> = {};

columnTypes.forEach((kuzuType: string, index: number) => {
  const colName = nodeColumns[index];
  let schemaType: ... = "STRING";
  
  const typeUpper = kuzuType.toUpperCase();
  if (typeUpper.includes("INT32")) {
    schemaType = "INT32";
  } else if (typeUpper.includes("INT16")) {
    schemaType = "INT16";
  }
  // ... more type mappings
  
  inferredTypes[colName] = schemaType;
});
```

**Where it should be:** `KuzuBaseService.importFromCSV()` - This is complex business logic for schema inference.

---

#### Lines 279-295: Schema Creation
```typescript
const primaryKeyType = inferredTypes[primaryKeyColumn] || "STRING";
const additionalProperties = nodeColumns.slice(1).map(col => ({
  name: col,
  type: inferredTypes[col] || "STRING"
}));

console.log(`[CSV Import] Creating node table with primary key: ${primaryKeyColumn} (${primaryKeyType})`);
console.log(`[CSV Import] Additional properties:`, additionalProperties);

await controller.db.createNodeSchema(
  nodeTableName,
  primaryKeyColumn,
  primaryKeyType,
  additionalProperties
);
```

**Where it should be:** `KuzuBaseService.importFromCSV()` - Schema creation is database business logic.

**Note:** It's OK to call `controller.db.createNodeSchema()` from UI, but the logic to *prepare* the schema (inferring types, mapping columns) should not be in UI.

---

#### Lines 297-318: Bulk Import Operations
```typescript
const copyNodesQuery = `COPY ${nodeTableName} FROM '${nodesPath}' (header = true)`;
console.log(`[CSV Import] Loading nodes with COPY FROM: ${copyNodesQuery}`);
await controller.db.executeQuery(copyNodesQuery);

const edgeTableQuery = hasWeight
  ? `CREATE REL TABLE ${edgeTableName} (
      FROM ${nodeTableName} TO ${nodeTableName},
      weight DOUBLE
    )`
  : `CREATE REL TABLE ${edgeTableName} (
      FROM ${nodeTableName} TO ${nodeTableName}
    )`;

console.log(`[CSV Import] Creating edge table with query: ${edgeTableQuery}`);
await controller.db.executeQuery(edgeTableQuery);
```

**Where it should be:** `KuzuBaseService.importFromCSV()` - Query construction and execution orchestration is business logic.

---

#### Lines 320-365: Directed/Undirected Graph Logic
```typescript
if (isDirected) {
  // For directed graphs, use COPY FROM directly
  const copyEdgesQuery = `COPY ${edgeTableName} FROM '${edgesPath}' (header = true)`;
  console.log(`[CSV Import] Loading directed edges with COPY FROM: ${copyEdgesQuery}`);
  await controller.db.executeQuery(copyEdgesQuery);
} else {
  // For undirected graphs, create edges in both directions
  const copyEdgesQuery1 = `COPY ${edgeTableName} FROM '${edgesPath}' (header = true)`;
  console.log(`[CSV Import] Loading undirected edges (direction 1)...`);
  await controller.db.executeQuery(copyEdgesQuery1);

  // Create reversed edges file
  const reversedEdgesPath = `${tempDir}/reversed_edges_${Date.now()}.csv`;
  const reversedEdgesContent = edgesLines.map((line, index) => {
    if (index === 0) return line;
    const parts = line.split(',');
    if (parts.length >= 2) {
      [parts[0], parts[1]] = [parts[1], parts[0]];
    }
    return parts.join(',');
  }).join('\n');

  fs.writeFile(reversedEdgesPath, reversedEdgesContent);
  
  const copyEdgesQuery2 = `COPY ${edgeTableName} FROM '${reversedEdgesPath}' (header = true)`;
  console.log(`[CSV Import] Loading undirected edges (direction 2)...`);
  await controller.db.executeQuery(copyEdgesQuery2);

  try {
    fs.unlink(reversedEdgesPath);
  } catch (e) {
    console.warn(`[CSV Import] Failed to clean up reversed edges file:`, e);
  }
}
```

**Where it should be:** `KuzuBaseService.importFromCSV()` - Complex business logic for handling graph directionality.

---

#### Lines 367-376: Cleanup Operations
```typescript
try {
  fs.unlink(nodesPath);
  fs.unlink(edgesPath);
} catch (e) {
  console.warn(`[CSV Import] Failed to clean up temporary files:`, e);
}
```

**Where it should be:** `KuzuBaseService.importFromCSV()` - Resource cleanup is service layer responsibility.

---

#### Lines 378-379: Graph State Refresh
```typescript
const graphState = await controller.db.snapshotGraphState();
```

**Where it should be:** `KuzuBaseService.importFromCSV()` - Should be the final step of the service method.

---

### ✅ What Should Stay in UI Layer (Lines 169-187, 383-393)

```typescript
handler: async ({ values }: { values: Record<string, any> }) => {
  const { name, nodes, edges, directed } = values;
  
  // ✅ Extract user input - UI responsibility
  const databaseName = name.value as string;
  const nodesFile = nodes.value as File;
  const edgesFile = edges.value as File;
  const isDirected = directed.value as boolean;
  
  try {
    const { controller } = await import("~/MainController");
    
    // ✅ Read file contents - UI responsibility (browser File API)
    const nodesText = await nodesFile.text();
    const edgesText = await edgesFile.text();
    
    // ✅ Extract simple metadata - UI responsibility
    const nodeTableName = nodesFile.name.replace(/\.csv$/i, '');
    const edgeTableName = edgesFile.name.replace(/\.csv$/i, '');
    
    // ✅ Call service method - ONE LINE!
    const result = await controller.db.importFromCSV(
      nodesText,
      edgesText,
      nodeTableName,
      edgeTableName,
      isDirected
    );
    
    // ✅ Handle result and display to user - UI responsibility
    if (result.success && result.data) {
      return {
        ...result,
        message: `Successfully imported graph "${databaseName}"...`,
      };
    }
    
    return result;
  } catch (error) {
    // ✅ Error handling and user feedback - UI responsibility
    console.error("[CSV Import] Error:", error);
    return {
      success: false,
      message: `Failed to import CSV: ${error.message}`,
    };
  }
}
```

**What UI should do:**
- Get user input (files, form values)
- Read file contents (browser API)
- Call controller method
- Handle errors and show user feedback

---

## Required Changes

### 1. Create `KuzuBaseService.importFromCSV()`

**File:** `src/kuzu/services/KuzuBaseService.ts`

**Add abstract method:**
```typescript
protected abstract getFileSystem(): any;
```

**Add method:**
```typescript
async importFromCSV(
  nodesText: string,
  edgesText: string,
  nodeTableName: string,
  edgeTableName: string,
  isDirected: boolean
) {
  // Move lines 188-379 from csv.tsx here
  // Replace `fs = kuzu.default.getFS()` with `fs = this.getFileSystem()`
  // No try/catch wrapper - just throw on error
}
```

**Why:** Shared business logic belongs in base service, accessible to all implementations.

---

### 2. Implement `getFileSystem()` in `KuzuInMemorySync`

**File:** `src/kuzu/services/KuzuInMemorySync.ts`

**Add method:**
```typescript
protected getFileSystem() {
  return kuzu.getFS();
}
```

**Why:** Implementation-specific code goes in concrete service.

---

### 3. Add Controller Pass-Through

**File:** `src/kuzu/controllers/KuzuController.ts`

**Add method:**
```typescript
async importFromCSV(
  nodesText: string,
  edgesText: string,
  nodeTableName: string,
  edgeTableName: string,
  isDirected: boolean
) {
  if (!this.service) {
    throw new Error("Kuzu service not initialized");
  }
  return this.service.importFromCSV(
    nodesText,
    edgesText,
    nodeTableName,
    edgeTableName,
    isDirected
  );
}
```

**Why:** Controller validates and delegates to service.

---

### 4. Expose in MainController

**File:** `src/MainController.ts`

**Add to `db` namespace:**
```typescript
async importFromCSV(
  nodesText: string,
  edgesText: string,
  nodeTableName: string,
  edgeTableName: string,
  isDirected: boolean
) {
  return Promise.resolve(
    kuzuController.importFromCSV(
      nodesText,
      edgesText,
      nodeTableName,
      edgeTableName,
      isDirected
    )
  );
}
```

**Why:** Consistent API exposed to frontend.

---

### 5. Simplify UI Handler

**File:** `src/features/visualizer/import/implementations/csv.tsx`

**Replace lines 181-379 with:**
```typescript
// Remove line 181 entirely
const result = await controller.db.importFromCSV(
  nodesText,
  edgesText,
  nodeTableName,
  edgeTableName,
  isDirected
);
```

**Result:** 210+ lines → 6 lines

---

## Architecture Pattern Reference

### Our Layered Architecture

```
UI Layer (csv.tsx)
  • Get user input
  • Display results
  • Handle errors
  ↓ calls
API Layer (MainController.ts)
  • Expose clean API
  • Namespace operations
  ↓ calls
Controller Layer (KuzuController.ts)
  • Validate initialization
  • Delegate to service
  ↓ calls
Base Service Layer (KuzuBaseService.ts) ⭐ PUT BUSINESS LOGIC HERE
  • Shared business logic
  • Query execution
  • Schema creation
  • Bulk operations
  ↑ extends
Concrete Service (KuzuInMemorySync.ts)
  • Implementation-specific code only
  • Minimal code
```

---

## Decision Framework

**When adding code, ask:**

| Question | If Yes | If No |
|----------|--------|-------|
| Does it interact with user/UI? | UI layer | Keep reading |
| Is it shared across all implementations? | Base service | Keep reading |
| Is it implementation-specific? | Concrete service | Keep reading |
| Is it just validation + delegation? | Controller | Keep reading |
| Is it exposing to frontend? | MainController | Re-evaluate |

---

## Key Principles

1. **Single Responsibility**: Each layer has one job
2. **Don't Repeat Yourself**: Shared logic in base classes
3. **Separation of Concerns**: UI ≠ Business Logic ≠ Data Access
4. **Fail Fast**: Backend throws, frontend catches

---

## Examples from Existing Code

### ✅ Good: `createNodeSchema` Pattern

**UI calls:**
```typescript
await controller.db.createNodeSchema(tableName, primaryKey, type, properties);
```

**Implementation:** Business logic in `KuzuBaseService.createNodeSchema()`

### ✅ Good: `executeQuery` Pattern

**UI calls:**
```typescript
await controller.db.executeQuery(cypherQuery);
```

**Implementation:** Query execution in `KuzuBaseService.executeQuery()`

### ❌ Bad: Original CSV Import

**UI contains:**
```typescript
// 210+ lines of business logic inline
```

**Should be:** One method call, logic in service layer

---

## Summary

| Aspect | Current | Should Be |
|--------|---------|-----------|
| Lines in UI | ~230 | ~50 |
| Business logic location | UI handler | Base service |
| Reusability | Not reusable | Reusable everywhere |
| Testability | Needs UI | Service testable independently |
| Consistency | Different pattern | Same pattern as other operations |
| kuzu-wasm import | Line 181 | Only in KuzuInMemorySync |

**Action:** Move business logic from UI → Service layer, following existing patterns.

---



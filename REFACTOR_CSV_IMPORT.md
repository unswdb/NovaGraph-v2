# Pull Request: Refactor CSV Import to Follow Layered Architecture

## Overview

This PR refactors the CSV import functionality to follow the project's layered architecture pattern. The original implementation had all business logic inline in the UI handler (~230 lines), bypassing the service layer. This refactor moves the logic to the appropriate layers, making it reusable, maintainable, and consistent with the rest of the codebase.

---

## 🔴 Problem: What Was Wrong?

### Original Code Structure

```
csv.tsx (UI Layer)
  └─> Direct kuzu-wasm import
  └─> 230+ lines of CSV processing logic
  └─> VFS file operations
  └─> Schema creation
  └─> Bulk import logic
  └─> Type inference
  └─> All inline in handler function
```

**Issues:**

1. ❌ **Violated Separation of Concerns**: Business logic in UI layer
2. ❌ **Not Reusable**: Logic locked in UI handler, can't be used elsewhere
3. ❌ **Redundant Import**: `kuzu-wasm/sync` imported at line 181 (already imported in service layer)
4. ❌ **Hard to Test**: Can't test CSV import without UI components
5. ❌ **Not Extensible**: Future Kuzu implementations (Persistent, Async) would need to duplicate all logic
6. ❌ **Inconsistent**: Every other operation uses `controller.db.method()` pattern

---

## ✅ Solution: Layered Architecture

### New Code Structure

```
csv.tsx (UI Layer)
  └─> controller.db.importFromCSV()

MainController.ts (API Layer)
  └─> kuzuController.importFromCSV()

KuzuController.ts (Controller Layer)
  └─> service.importFromCSV()

KuzuBaseService.ts (Base Service Layer) ⭐ Shared implementation
  └─> this.getFileSystem() (abstract method)
  └─> All CSV import logic here

KuzuInMemorySync.ts (Concrete Service)
  └─> implements getFileSystem() → kuzu.getFS()
```

**Benefits:**

1. ✅ **Proper Layering**: Each layer has its responsibility
2. ✅ **Reusable**: Any part of the app can call `controller.db.importFromCSV()`
3. ✅ **Single Source of Truth**: CSV logic in one place
4. ✅ **Testable**: Can test service layer independently
5. ✅ **Extensible**: New Kuzu implementations inherit all functionality
6. ✅ **Consistent**: Follows the same pattern as all other operations

---

## 📁 File Structure & Responsibilities

### Understanding the Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI/Feature Layer                          │
│  src/features/visualizer/import/implementations/csv.tsx     │
│                                                              │
│  Responsibility:                                             │
│  • Handle user input (File uploads, form values)            │
│  • Display UI components                                     │
│  • Call controller methods                                   │
│  • Handle errors and show user feedback                      │
│                                                              │
│  DO: Get user input, display results                        │
│  DON'T: Business logic, database operations, VFS access     │
└─────────────────────────────────────────────────────────────┘
                            ▼ calls
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  src/MainController.ts                                       │
│                                                              │
│  Responsibility:                                             │
│  • Expose clean, simple API to frontend                     │
│  • Namespace operations (db.*, _internal.*)                 │
│  • Thin wrapper around KuzuController                        │
│                                                              │
│  DO: Expose controller methods with Promise.resolve         │
│  DON'T: Business logic, validation, data transformation     │
└─────────────────────────────────────────────────────────────┘
                            ▼ calls
┌─────────────────────────────────────────────────────────────┐
│                   Controller Layer                           │
│  src/kuzu/controllers/KuzuController.ts                     │
│                                                              │
│  Responsibility:                                             │
│  • Validate service is initialized                          │
│  • Route calls to appropriate service                        │
│  • Service lifecycle management                              │
│                                                              │
│  DO: Check initialization, delegate to service              │
│  DON'T: Implement business logic                             │
└─────────────────────────────────────────────────────────────┘
                            ▼ calls
┌─────────────────────────────────────────────────────────────┐
│                  Base Service Layer (ABSTRACT)               │
│  src/kuzu/services/KuzuBaseService.ts                       │
│                                                              │
│  Responsibility:                                             │
│  • Shared business logic for ALL Kuzu implementations       │
│  • Query execution, schema creation, bulk imports           │
│  • Define abstract methods for implementation-specific code │
│                                                              │
│  DO: Implement shared logic, define abstractions            │
│  DON'T: Implementation-specific code (filesystem, etc.)     │
└─────────────────────────────────────────────────────────────┘
                            ▲ extends
┌─────────────────────────────────────────────────────────────┐
│              Concrete Service Layer                          │
│  src/kuzu/services/KuzuInMemorySync.ts                      │
│                                                              │
│  Responsibility:                                             │
│  • Implement abstract methods from base                      │
│  • Handle implementation-specific details                    │
│  • Minimal code - just the differences                       │
│                                                              │
│  DO: Initialize database, implement getFileSystem()         │
│  DON'T: Duplicate shared logic from base                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Detailed Changes

### 1. Made KuzuBaseService Abstract

**File:** `src/kuzu/services/KuzuBaseService.ts`

**Before:**
```typescript
export default class KuzuBaseService {
  // Normal class - could be instantiated
  // No enforcement of implementation-specific methods
}
```

**After:**
```typescript
export default abstract class KuzuBaseService {
  // Abstract class - cannot be instantiated
  // Forces subclasses to implement required methods
  
  /**
   * Get the virtual file system for the current Kuzu implementation
   * Must be implemented by subclasses
   */
  protected abstract getFileSystem(): any;
  
  // ... all shared logic here
}
```

**Why?**
- Prevents accidental instantiation of incomplete base class
- Forces future implementations to provide `getFileSystem()`
- Compiler enforces the contract at build time (type safety)

---

### 2. Added importFromCSV to KuzuBaseService

**File:** `src/kuzu/services/KuzuBaseService.ts`

**Added:** 200+ lines of shared CSV import logic

```typescript
async importFromCSV(
  nodesText: string,
  edgesText: string,
  nodeTableName: string,
  edgeTableName: string,
  isDirected: boolean
) {
  // ✅ Throws errors directly - no try/catch wrapper
  // ✅ Frontend handles all errors
  
  // Parse CSV headers
  // Write to VFS using this.getFileSystem()
  // Infer types with LOAD FROM
  // Create schemas
  // Bulk load with COPY FROM
  // Handle directed/undirected graphs
  // Clean up temp files
  // Return graph state
}
```

**Key Design Decisions:**

1. **No Try/Catch Wrapper**: Follows project pattern - backend throws, frontend catches
2. **Uses Abstract Method**: Calls `this.getFileSystem()` (implemented by subclasses)
3. **Automatic Type Inference**: Uses Kuzu's LOAD FROM to infer column types
4. **Bulk Operations**: Uses COPY FROM for performance (not row-by-row)

---

### 3. Implemented getFileSystem in KuzuInMemorySync

**File:** `src/kuzu/services/KuzuInMemorySync.ts`

**Before:** 265 lines (had duplicate importFromCSV implementation)

**After:** 58 lines (only implementation-specific code)

```typescript
export default class KuzuInMemorySync extends KuzuBaseService {
  async initialize() {
    // Initialize Kuzu WASM module
    await kuzu.init();
    this.db = new kuzu.Database(":memory:");
    this.connection = new kuzu.Connection(this.db);
  }
  
  /**
   * Get the virtual file system for Kuzu WASM
   */
  protected getFileSystem() {
    return kuzu.getFS();
  }
  
  cleanup() {
    // Close connections
  }
}
```

**Code Reduction:** 265 lines → 58 lines (207 lines removed!)

---

### 4. Added Pass-Through in KuzuController

**File:** `src/kuzu/controllers/KuzuController.ts`

**Added:**
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

**Pattern:** Check initialization → delegate to service

---

### 5. Exposed in MainController.db

**File:** `src/MainController.ts`

**Added to `db` namespace:**
```typescript
db = {
  // ... existing methods
  
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
  },
}
```

**Pattern:** Wrap controller call in Promise.resolve (consistent with other methods)

---

### 6. Simplified csv.tsx Handler

**File:** `src/features/visualizer/import/implementations/csv.tsx`

**Before:** 230+ lines of inline logic

**After:** ~50 clean lines

```typescript
handler: async ({ values }: { values: Record<string, any> }) => {
  const { name, nodes, edges, directed } = values;
  
  const databaseName = name.value as string;
  const nodesFile = nodes.value as File;
  const edgesFile = edges.value as File;
  const isDirected = directed.value as boolean;
  
  try {
    const { controller } = await import("~/MainController");
    
    // Read CSV file contents
    const nodesText = await nodesFile.text();
    const edgesText = await edgesFile.text();
    
    // Extract table names from filenames
    const nodeTableName = nodesFile.name.replace(/\.csv$/i, '');
    const edgeTableName = edgesFile.name.replace(/\.csv$/i, '');
    
    // ⭐ Single line does everything!
    const result = await controller.db.importFromCSV(
      nodesText,
      edgesText,
      nodeTableName,
      edgeTableName,
      isDirected
    );
    
    if (result.success && result.data) {
      return {
        ...result,
        message: `Successfully imported graph "${databaseName}"...`,
      };
    }
    
    return result;
  } catch (error) {
    // Frontend handles all errors
    return {
      success: false,
      message: `Failed to import CSV: ${error.message}`,
    };
  }
}
```

**Changes:**
- ❌ Removed: kuzu-wasm import (line 181)
- ❌ Removed: 180+ lines of business logic
- ✅ Added: Single call to `controller.db.importFromCSV()`
- ✅ Kept: Error handling (FE responsibility)

---

## 🎓 How to Add New Features (Tutorial)

### Example: Adding a JSON Import Feature

Following the same pattern, here's how you would add JSON import:

#### Step 1: Add to Base Service Layer

**File:** `src/kuzu/services/KuzuBaseService.ts`

```typescript
async importFromJSON(
  jsonText: string,
  tableName: string
) {
  if (!this.connection) {
    throw new Error("Kuzu service not initialized");
  }
  
  // Parse JSON
  const data = JSON.parse(jsonText);
  
  // Implement business logic here
  // - Infer schema from JSON
  // - Create node table
  // - Insert nodes
  // - Return graph state
  
  const graphState = await this.snapshotGraphState();
  
  return {
    success: true,
    message: `Imported ${data.length} nodes`,
    data: graphState,
  };
}
```

**✅ DO:**
- Put shared business logic here
- Use existing methods (`createNodeSchema`, `executeQuery`, etc.)
- Throw errors directly (no try/catch wrapper)
- Use `this.getFileSystem()` if you need filesystem access

**❌ DON'T:**
- Add UI-specific code
- Handle frontend errors
- Duplicate logic that already exists

#### Step 2: Add to Controller Layer

**File:** `src/kuzu/controllers/KuzuController.ts`

```typescript
async importFromJSON(jsonText: string, tableName: string) {
  if (!this.service) {
    throw new Error("Kuzu service not initialized");
  }
  return this.service.importFromJSON(jsonText, tableName);
}
```

**✅ DO:**
- Check if service is initialized
- Delegate to service
- Keep it simple (just validation + delegation)

**❌ DON'T:**
- Implement business logic
- Transform data
- Add complex logic

#### Step 3: Expose in MainController

**File:** `src/MainController.ts`

```typescript
db = {
  // ... existing methods
  
  async importFromJSON(jsonText: string, tableName: string) {
    return Promise.resolve(
      kuzuController.importFromJSON(jsonText, tableName)
    );
  },
}
```

**✅ DO:**
- Add to `db` namespace (for database operations)
- Wrap in `Promise.resolve()` (consistent pattern)
- Use same signature as controller

**❌ DON'T:**
- Add logic here
- Change signatures

#### Step 4: Use in UI Layer

**File:** `src/features/visualizer/import/implementations/json.tsx`

```typescript
handler: async ({ values }) => {
  try {
    const { controller } = await import("~/MainController");
    
    const jsonFile = values.file.value as File;
    const jsonText = await jsonFile.text();
    const tableName = jsonFile.name.replace(/\.json$/i, '');
    
    // Single clean call
    const result = await controller.db.importFromJSON(jsonText, tableName);
    
    return result;
  } catch (error) {
    // Handle errors
    return {
      success: false,
      message: error.message,
    };
  }
}
```

**✅ DO:**
- Handle user input
- Call controller methods
- Catch and display errors
- Keep it thin

**❌ DON'T:**
- Implement business logic
- Access database directly
- Import service/controller files directly (use MainController)

---

## 🔍 API Usage Patterns

### Pattern 1: Database Operations

**Always use:** `controller.db.methodName()`

```typescript
// ✅ Correct
const { controller } = await import("~/MainController");
await controller.db.createNodeSchema(...);
await controller.db.executeQuery(...);
await controller.db.importFromCSV(...);

// ❌ Wrong - bypasses abstraction
import kuzuController from "~/kuzu/controllers/KuzuController";
kuzuController.createNodeSchema(...);

// ❌ Wrong - UI shouldn't import services directly
import KuzuInMemorySync from "~/kuzu/services/KuzuInMemorySync";
```

### Pattern 2: Internal Operations

**Use:** `controller._internal.methodName()`

```typescript
// ✅ Correct - for internal/advanced operations
const schemaInfo = await controller._internal.getSingleSchemaProperties("Person");
```

### Pattern 3: Algorithm Operations

**Use:** `controller.getAlgorithm().methodName()`

```typescript
// ✅ Correct - for graph algorithms
const algorithm = controller.getAlgorithm();
await algorithm.runPageRank();
```

### Pattern 4: Error Handling

**Backend: Throw**
```typescript
// In service layer
async someMethod() {
  if (!valid) {
    throw new Error("Validation failed"); // ✅ Just throw
  }
  // No try/catch wrapper needed
}
```

**Frontend: Catch**
```typescript
// In UI layer
try {
  const result = await controller.db.someMethod();
  // Success handling
} catch (error) {
  // Error handling
  return { success: false, message: error.message };
}
```

---

## 📊 Code Metrics

### Lines of Code

| File | Before | After | Change |
|------|--------|-------|--------|
| `csv.tsx` | 513 | 343 | -170 ⬇️ |
| `KuzuBaseService.ts` | 264 | 479 | +215 ⬆️ |
| `KuzuInMemorySync.ts` | 265 | 58 | -207 ⬇️ |
| `KuzuController.ts` | 335 | 364 | +29 ⬆️ |
| `MainController.ts` | 209 | 236 | +27 ⬆️ |
| **Total** | **1,586** | **1,480** | **-106 ⬇️** |

**Net Reduction:** 106 lines removed
**Key Benefit:** Shared logic centralized (not duplicated)

### Complexity Reduction

- **Before:** CSV logic duplicated across implementations (would be 230+ lines × each implementation)
- **After:** CSV logic written once, inherited by all implementations
- **Future Savings:** New implementations get CSV import for free

---

## 🎯 Key Takeaways

### Architecture Principles

1. **Separation of Concerns**
   - UI → User interaction only
   - API → Expose clean interface
   - Controller → Validate & route
   - Service → Business logic
   
2. **Don't Repeat Yourself (DRY)**
   - Shared logic in base classes
   - Implementation-specific code in subclasses
   
3. **Single Responsibility**
   - Each layer has one job
   - Each file has one purpose
   
4. **Fail Fast, Fail Loud**
   - Backend throws immediately
   - Frontend catches and handles
   - No silent failures

### When Adding New Features

Ask yourself:
1. **Is this business logic?** → Add to service layer
2. **Is this UI-specific?** → Keep in UI layer
3. **Does this need database access?** → Use `controller.db.*`
4. **Is this shared across implementations?** → Add to base service
5. **Is this implementation-specific?** → Add to concrete service

### Common Mistakes to Avoid

❌ Importing services directly in UI
❌ Adding business logic to UI handlers
❌ Duplicating code across implementations
❌ Catching errors in backend (let them throw!)
❌ Bypassing the controller layer

---

## 📚 Further Reading

- **Abstract Classes vs Interfaces:** See inline documentation in `KuzuBaseService.ts`
- **Service Layer Pattern:** All `*Service.ts` files in `src/kuzu/services/`
- **Controller Pattern:** See `KuzuController.ts` for delegation pattern
- **API Design:** See `MainController.ts` for namespace organization

---

## Questions?

If you're adding a new feature and unsure where it belongs, ask:

1. **"Could this be reused across different Kuzu implementations?"**
   - Yes → Put in `KuzuBaseService.ts`
   - No → Put in concrete implementation

2. **"Does this interact with the user?"**
   - Yes → UI layer
   - No → Service layer

3. **"Does this need filesystem, network, or external resources?"**
   - Yes → Might need abstract method for implementation-specific handling

Follow the existing patterns, and you'll be fine! 🚀

---

**Reviewer:** @jiu  
**Author:** AI Assistant  
**Date:** November 11, 2025


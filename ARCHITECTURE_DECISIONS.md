# 🧩 Architecture Decisions

This document summarizes key architectural choices made in the project.  
It’s intended to help new contributors quickly understand the design rationale and structure.

---

## 📘 Table of Contents
1. [MainController Structure](#1-maincontroller-structure)
2. [Kuzu Controller Design](#2-kuzu-controller-design)
3. [IGraph Controller Integration](#3-igraph-controller-integration)
4. [IGraph Singleton Decision](#4-igraph-singleton-decision)
5. [Direction Metadata Handling](#5-direction-metadata-handling)
6. [Frontend Access Pattern](#6-frontend-access-pattern)
7. [Summary](#7-summary)

---

## 1. MainController Structure

**Available choices:**
- Plain function-based module  
- Class-based singleton  

**Current choice:**  
✅ **Class-based singleton**

**Reason:**  
Keeps all resources (Kuzu, IGraph) alive in memory, provides a single entry point for the frontend  
(`controller.db.*`, `controller.algorithm.*`), and maintains clear namespacing.

---

## 2. Kuzu Controller Design

**Available choices:**
- Singleton controller  
- Normal instance owned by MainController  

**Current choice:**  
✅ **Singleton (for now)**

**Reason:**  
Originally designed to guarantee data consistency across the app.  
This can be refactored later into a normal instance, since MainController already ensures a single access point.

---

## 3. IGraph Controller Integration

**Available choices:**
- Integrate IGraph directly into Kuzu layer  
- Keep IGraph as a separate controller, managed by MainController  

**Current choice:**  
✅ **Separate `IGraphController` instantiated inside MainController**

**Reason:**  
Kuzu remains the source of truth; IGraph handles only algorithmic operations.  
This separation avoids unnecessary coupling and simplifies the data flow.

---

## 4. IGraph Singleton Decision

**Available choices:**
- Singleton instance  
- Normal instance (created by MainController)  

**Current choice:**  
✅ **Normal instance**

**Reason:**  
IGraph has no persistent state.  
Each algorithm call fetches data from Kuzu, runs computation, and returns results.  
Singleton adds no meaningful benefit other than cosmetic consistency.

---

## 5. Direction Metadata Handling

**Available choices:**
- Store in frontend  
- Store in MainController  
- Store in Kuzu layer  

**Current choice:**  
✅ **Stored in `KuzuBaseService`**

**Reason:**  
Direction is metadata about relationships — part of the data model.  
Keeping it at the KuzuBase layer ensures consistent handling and clean data exports to IGraph.

---

## 6. Frontend Access Pattern

**Available choices:**
- Import individual functions directly  
- Use a single exported controller instance  

**Current choice:**  
✅ **Single exported controller instance**

**Reason:**  
Simplifies frontend usage and keeps imports clean:  
```ts
controller.db.addNode(...);
controller.algorithm.bfs(...);
```

---

## 7. Summary

| Layer / Component | Role | Singleton? | Notes |
|-------------------|------|------------|-------|
| MainController | Central API layer between FE and core services | ✅ | Single exported instance |
| KuzuController | Source of truth for graph data and direction | ✅ (for now) | May become normal instance later |
| KuzuBaseService | Data abstraction + direction handling | – | Owns graph semantics |
| IGraphController | Algorithmic layer (bfs, etc.) | ❌ | Instantiated by MainController |
| Frontend | Consumer of unified controller API | – | Calls `controller.db.*` / `controller.algorithm.*` |

**✅ Core Principles:**
- Single access point from FE through MainController
- Kuzu = truth, IGraph = computation  
- Minimal wrappers, modular structure, and clear ownership

---

## 🧩 IGraph Controller Architecture Decisions

### **Decision 1: Modular Algorithm Structure**
- **Available Choices:**
  - A) Implement all algorithms directly in `IGraphController`.
  - B) Split algorithms into separate modules/files grouped by category (e.g. PathFinding, Centrality).
- **Chosen Option:** **B) Grouped by Category**
- **Reasoning:**
  - Improves scalability and modularity.
  - Keeps `IGraphController` lightweight.
  - Allows clear separation of logic between categories and easier unit testing.

### **Decision 2: Exposure Pattern to Frontend**
- **Available Choices:**
  - A) Nested FE calls like `controller.algorithm.PathFinding.bfs()`.
  - B) Flat FE calls like `controller.algorithm.bfs()` with internal routing.
- **Chosen Option:** **B) Flat Exposure**
- **Reasoning:**
  - Keeps frontend usage simple and ergonomic.
  - Controller internally delegates to corresponding algorithm modules.
  - Maintains flexibility to change or reorganize internal logic without affecting FE API.

### **Decision 3: Internal Naming Convention**
- **Available Choices:**
  - A) Plain names (e.g., `runBFS()`).
  - B) Prefixed internal names (e.g., `_igraphRunBFS()`).
- **Chosen Option:** **B) Prefixed Internal Names**
- **Reasoning:**
  - Clarifies that these are internal WASM algorithm calls.
  - Prevents direct usage outside `IGraphController`.
  - Leaves room for future integration with other engines (e.g., `_neo4jRunBFS()`).

### **Decision 4: Controller Composition**
- **Available Choices:**
  - A) Import each algorithm individually.
  - B) Compose grouped classes (e.g., `PathFinding`, `Centrality`) inside `IGraphController`.
- **Chosen Option:** **B) Grouped Composition**
- **Reasoning:**
  - Keeps logical separation while allowing centralized orchestration.
  - Easier maintenance and future expansion.
  - Performance overhead negligible compared to WASM execution.

---

# Extending Algorithm Options for NovaGraph Visualizer

The `algorithms/` folder contains implementations of algorithms that can be run on graphs within NovaGraph's visualizer. These algorithms are defined based on the `igraph` implementations in the `wasm/` folder. This guide explains how to extend the algorithm options by adding new algorithms or sections (within the sidebar).

## Steps to Extend Algorithm Options

### 1. Ensure Algorithm Implementation Exists

Before adding a new algorithm, make sure it is implemented in both `igraph` (inside `wasm/`) and in our `IgraphController` within the Kuzu controller. The `wasmFunction` defined in the `GraphAlgorithm` interface delegates to `IgraphController`, which then invokes the corresponding function in `igraph`. If the algorithm isn’t implemented in both layers, it cannot be called.

### 2. Create a New File

To create a new algorithm option:

- Create a new file under any folder within `implementations/` using a descriptive file name (e.g., `page-rank.ts`).
- Optionally, create a new folder if the algorithm should belong to a new section of the sidebar. These folders represent different sections of the algorithm sidebar.

### 3. Define the Algorithm

Inside the file, define the algorithm based on the `GraphAlgorithm<TData>` interface located in `implementations/types.ts`.

Example implementation:

```ts
export const bfs = createGraphAlgorithm<BFSOutputData>({
  title: "Breadth-First Search",
  description:
    "Traverses the graph from a source by exploring all neighbors level by level. It continues until all nodes are visited.",
  inputs: [
    createAlgorithmSelectInput({
      id: "bfs-start-node",
      key: "start_node",
      displayName: "Start Node",
      source: "nodes",
      required: true,
    }),
  ],
  wasmFunction: async (igraphController, [arg1]) => {
    return await igraphController.bfs(arg1);
  },
  output: (props) => <BFS {...props} />,
});
```

### 4. Register the Algorithm

After defining the algorithm, register it in the appropriate folder's `index.ts` file and expose it in `implementations/index.ts`.

#### a. Add to Folder's `index.ts`

Example for the Traversal & Connectivity folder:

```ts
export * from "./bfs";
export * from "./dfs";
...
```

#### b. Add to `ALL_ALGORITHMS` in `implementations/index.ts`

Register the folder in `implementations/index.ts` to make it available in the sidebar.

```ts
const ALL_ALGORITHMS: {
  label: string;
  icon: ElementType;
  algorithms: BaseGraphAlgorithm[];
}[] = [
  {
    label: "Traversal & Connectivity",
    icon: GitBranch,
    algorithms: Object.values(TRAVERSAL_CONNECTIVITY) as BaseGraphAlgorithm[],
  },
  // Add other sections here
];
```

## Note

Algorithms within each folder are automatically sorted alphabetically (A-Z). However, the order of sections in the sidebar depends on the order in `ALL_ALGORITHMS`.

## Conclusion

With this guide, you can extend algorithm options in NovaGraph's visualizer to support new graph algorithms. Ensure proper validation, compatibility, and registration for each new algorithm to maintain consistency and reliability across the codebase.

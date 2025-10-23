# Algorithm Function Signatures Overview

## Path Finding:

### Dijkstra
- `dijkstra_source_to_target(igraph_integer_t src, igraph_integer_t tar)`
- `dijkstra_source_to_all(igraph_integer_t src)`

### Bellman-Ford
- `bf_source_to_target(igraph_integer_t src, igraph_integer_t tar)`
- `bf_source_to_all(igraph_integer_t src)`

### Yen's k-Shortest Paths
- `yen_source_to_target(igraph_integer_t src, igraph_integer_t tar, igraph_integer_t k)`

### Graph Traversal
- `bfs(igraph_integer_t src)`
- `dfs(igraph_integer_t src)`
- `randomWalk(igraph_integer_t start, int steps)`

### Spanning Tree
- `min_spanning_tree(void)`


## Centrality:

- `betweenness_centrality(void)`
- `closeness_centrality(void)`
- `degree_centrality(void)`
- `eigenvector_centrality(void)`
- `harmonic_centrality(void)`
- `strength(void)`
- `pagerank(igraph_real_t damping)`


## Community Detection:

### Modularity-based
- `louvain(igraph_real_t resolution)`
- `leiden(igraph_real_t resolution)`
- `fast_greedy(void)`
- `label_propagation(void)`

### Clustering
- `local_clustering_coefficient(void)`
- `k_core(int k)`
- `triangles(void)`

### Connected Components
- `connected_components(igraph_connectedness_t mode)`
- `strongly_connected_components(void)`
- `weakly_connected_components(void)`


## Miscellaneous:

### Adjacency & Similarity
- `vertices_are_adjacent(igraph_integer_t src, igraph_integer_t tar)`
- `jaccard_similarity(val js_vs_list)`

### Graph Properties
- `topological_sort(void)`
- `diameter(void)`

### Eulerian Paths & Circuits
- `eulerian_path(void)`
- `eulerian_circuit(void)`

### Edge Prediction
- `missing_edge_prediction_default_values(void)`
- `missing_edge_prediction(int numSamples, int numBins)`

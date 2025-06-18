#ifndef GRAPH_H
#define GRAPH_H

#include "igraph_wrappers.h"
#include <emscripten/val.h>
#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <unordered_map>
#include <unordered_set>

//#define N 11 // number of nodes
extern igraph_t globalGraph;      // igraph structure
extern igraph_vector_t globalWeights;   // edge weights

#define MODE_COLOR_IMPORTANT        1   // Dark for important, light for less important
#define MODE_COLOR_SHADE_DEFAULT    2   // Multiple purple shades
#define MODE_COLOR_SHADE_ERROR      3   // Multiple purple shades with error for missing entries
#define MODE_SIZE_SCALAR            4   // No color change but size is scaled
#define MODE_RAINBOW                5   // Multiple colors in various groups

using namespace emscripten;

val initGraph(void);
void cleanupGraph(void);

std::string igraph_check_attribute(const igraph_t *graph);
igraph_error_t igraph_init_copy(igraph_t *to, const igraph_t *from);
std::string igraph_get_name(igraph_integer_t v);
igraph_vector_t *igraph_weights(void);

void frequenciesToColorMap(std::unordered_map<int, int> fm, val &colorMap);
void doublesToColorMap(std::unordered_map<int, double> dm, val &colorMap);

val dijkstra_source_to_target(igraph_integer_t src, igraph_integer_t tar);
val dijkstra_source_to_all(igraph_integer_t src);
val yen_source_to_target(igraph_integer_t src, igraph_integer_t tar, igraph_integer_t k);
val bf_source_to_target(igraph_integer_t src, igraph_integer_t tar);
val bf_source_to_all(igraph_integer_t src);
val bfs(igraph_integer_t src);
val dfs(igraph_integer_t src);
val randomWalk(igraph_integer_t start, int steps);
val min_spanning_tree(void);

val betweenness_centrality(void);
val closeness_centrality(void);
val degree_centrality(void);
val eigenvector_centrality(void);
val harmonic_centrality(void);
val strength(void);
val pagerank(igraph_real_t damping);

val louvain(igraph_real_t resolution);
val leiden(igraph_real_t resolution);
val fast_greedy(void);
val label_propagation(void);
val local_clustering_coefficient(void);
val k_core(int k);
val triangles(void);
val strongly_connected_components(void);
val weakly_connected_components(void);

val vertices_are_adjacent(igraph_integer_t src, igraph_integer_t tar);
val jaccard_similarity(val js_vs_list);
val topological_sort(void);
val diameter(void);
val eulerian_path(void);
val eulerian_circuit(void);
val missing_edge_prediction_default_values(void);
val missing_edge_prediction(int numSamples, int numBins);

#endif
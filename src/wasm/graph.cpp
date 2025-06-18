#include "graph.h"
#include "generators/generator.h"
#include <iostream>
#include <emscripten/bind.h>

using namespace emscripten;

igraph_t globalGraph;
igraph_vector_t globalWeights;


// The first graph to be rendered on the screen
val initGraph(void) {
    igraph_set_attribute_table(&igraph_cattribute_table);

    igraph_empty(&globalGraph, 10, IGRAPH_UNDIRECTED);

    // Use European cities as nodes
    SETVAS(&globalGraph, "name", 0, "London");
    SETVAS(&globalGraph, "name", 1, "Paris");
    SETVAS(&globalGraph, "name", 2, "Berlin");
    SETVAS(&globalGraph, "name", 3, "Rome");
    SETVAS(&globalGraph, "name", 4, "Madrid");
    SETVAS(&globalGraph, "name", 5, "Athens");
    SETVAS(&globalGraph, "name", 6, "Amsterdam");
    SETVAS(&globalGraph, "name", 7, "Brussels");
    SETVAS(&globalGraph, "name", 8, "Lisbon");
    SETVAS(&globalGraph, "name", 9, "Prague");

    // Create some edges to connect these cities in a network
    igraph_add_edge(&globalGraph, 0, 1);
    igraph_add_edge(&globalGraph, 0, 6);
    igraph_add_edge(&globalGraph, 1, 7);
    igraph_add_edge(&globalGraph, 1, 4);
    igraph_add_edge(&globalGraph, 1, 3);
    igraph_add_edge(&globalGraph, 1, 2);
    igraph_add_edge(&globalGraph, 2, 6);
    igraph_add_edge(&globalGraph, 2, 9);
    igraph_add_edge(&globalGraph, 4, 8);
    igraph_add_edge(&globalGraph, 5, 9);
    igraph_add_edge(&globalGraph, 6, 7);

    val result = val::object();
    result.set("nodes", graph_nodes());
    result.set("edges", graph_edges());
    return result;
}

void cleanupGraph(void) {
    igraph_destroy(&globalGraph);
    igraph_vector_destroy(&globalWeights);
}

void test() {
    // test an exception
    throw std::runtime_error("This is a test exception");
    std::cout << "This is a test" << std::endl;
}

val what_to_stderr(intptr_t ptr) {
    auto error = reinterpret_cast<std::runtime_error*>(ptr);
    return val(error->what());
}


EMSCRIPTEN_BINDINGS(graph) {
  register_vector<uint8_t>("VectorUint8");

  // Expose the functions
  function("initGraph", &initGraph);
  function("test", &test);
  function("what_to_stderr", &what_to_stderr);

  function("generate_graph_from_csv", &graph_from_csv);
  function("generate_graph_from_json", &graph_from_json);
  function("generate_graph_from_gml", &graph_from_gml);
  function("generate_graph_from_gexf", &graph_from_gexf);
  function("generate_graph_from_n_nodes", &graph_from_n_nodes);

  function("dijkstra_source_to_target", &dijkstra_source_to_target);
  function("dijkstra_source_to_all", &dijkstra_source_to_all);
  function("yens_algorithm", &yen_source_to_target);
  function("bellman_ford_source_to_target", &bf_source_to_target);
  function("bellman_ford_source_to_all", &bf_source_to_all);
  function("cleanupGraph", &cleanupGraph);
  function("bfs", &bfs);
  function("dfs", &dfs);
  function("random_walk", &randomWalk);
  function("min_spanning_tree", &min_spanning_tree);

  function("betweenness_centrality", &betweenness_centrality);
  function("closeness_centrality", &closeness_centrality);
  function("degree_centrality", &degree_centrality);
  function("eigenvector_centrality", &eigenvector_centrality);
  function("strength_centrality", &strength);
  function("harmonic_centrality", &harmonic_centrality);
  function("pagerank", &pagerank);

  function("louvain", &louvain);
  function("leiden", &leiden);
  function("fast_greedy", &fast_greedy);
  function("label_propagation", &label_propagation);
  function("local_clustering_coefficient", &local_clustering_coefficient);
  function("k_core", &k_core);
  function("triangle_count", &triangles);
  function("strongly_connected_components", &strongly_connected_components);
  function("weakly_connected_components", &weakly_connected_components);

  function("vertices_are_adjacent", &vertices_are_adjacent);
  function("jaccard_similarity", &jaccard_similarity);
  function("topological_sort", &topological_sort);
  function("diameter", &diameter);
  function("eulerian_path", &eulerian_path);
  function("eulerian_circuit", &eulerian_circuit);
  function("missing_edge_prediction_default_values", &missing_edge_prediction_default_values);
  function("missing_edge_prediction", &missing_edge_prediction);
}

// emcc demo.cpp -O3 -s WASM=1 -s -sEXPORTED_FUNCTIONS=_sum,_subtract --no-entry -o demo.wasm
// em++ -Os graph.cpp -s WASM=1 -o graph.js -s EXPORTED_RUNTIME_METHODS='["cwrap"]' -I./igraph/build/include -I./igraph/include ./igraph/build/src/libigraph.a -lembind --no-entry
// em++ -Os graph.cpp -s WASM=1 -o graph.js -s -I./igraph/build/include -I./igraph/include ./igraph/build/src/libigraph.a -lembind --no-entry -s EXPORT_ES6=1 -s MODULARIZE=1
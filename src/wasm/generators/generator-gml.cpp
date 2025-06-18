#include "generator.h"

val graph_from_gml(const std::string& filename) {
    igraph_t graph;
    FILE *file = fopen(filename.c_str(), "r");
    if (file == NULL) throw std::runtime_error("File not found: " + filename);

    igraph_read_graph_gml(&graph, file);
    fclose(file);

    igraph_destroy(&globalGraph);
    igraph_init_copy(&globalGraph, &graph);

    val result = val::object();
    result.set("nodes", graph_nodes());
    result.set("edges", graph_edges());
    result.set("directed", igraph_is_directed(&graph));

    igraph_vector_destroy(&globalWeights);
    igraph_destroy(&graph);
    return result;
}
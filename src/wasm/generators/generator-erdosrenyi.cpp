#include "generator.h"
#include <stdlib.h>
#include <time.h>

val graph_from_n_nodes(igraph_integer_t n, igraph_real_t p, bool directed) {
    igraph_destroy(&globalGraph);
    igraph_vector_destroy(&globalWeights);
    igraph_erdos_renyi_game_gnp(&globalGraph, n, p, directed, false);

    srand(time(NULL));
    igraph_vector_init(&globalWeights, 0);

    for (igraph_integer_t i = 0; i < igraph_ecount(&globalGraph); i++) {
        igraph_vector_push_back(&globalWeights, rand() % 20 + 1);
    }

    val result = val::object();
    result.set("nodes", graph_nodes());
    result.set("edges", graph_edges());
    result.set("directed", directed);
    return result;
}
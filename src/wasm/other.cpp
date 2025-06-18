#include "graph.h"
#include <iostream>

// contains my own custom igraph functions

std::string igraph_check_attribute(const igraph_t *graph) {
    if (igraph_cattribute_has_attr(graph, IGRAPH_ATTRIBUTE_VERTEX, "name")) {
        return "name";
    } else if (igraph_cattribute_has_attr(graph, IGRAPH_ATTRIBUTE_VERTEX, "label")) {
        return "label";
    } else if (igraph_cattribute_has_attr(graph, IGRAPH_ATTRIBUTE_VERTEX, "id")) {
        return "id";
    } else {
        return "";
    }
}


igraph_error_t igraph_init_copy(igraph_t *to, const igraph_t *from) {
    // copy the edges
    igraph_vector_int_t edges;
    igraph_vector_int_init(&edges, 0);
    igraph_get_edgelist(from, &edges, 0);

    // create
    igraph_error_t ret = igraph_create(to, &edges, igraph_vcount(from), igraph_is_directed(from));
    
    // copy the name attributes depending on where they are stored
    igraph_strvector_t names;
    igraph_strvector_init(&names, 0);
    std::string attr = igraph_check_attribute(from);

    if (!attr.empty()) {
        igraph_cattribute_VASV(from, attr.c_str(), igraph_vss_all(), &names);
        igraph_cattribute_VAS_setv(to, "name", &names);
    }

    igraph_strvector_destroy(&names);
    igraph_vector_int_destroy(&edges);
    return ret;
}

std::string igraph_get_name(igraph_integer_t v) {
    std::string attr = igraph_check_attribute(&globalGraph);
    if (attr.empty()) {
        return std::to_string(v);
    } else {
        return VAS(&globalGraph, attr.c_str(), v);
    }
}

igraph_vector_t *igraph_weights() {
    bool hasWeights = VECTOR(globalWeights) != NULL;
    return hasWeights ? &globalWeights : NULL;
}
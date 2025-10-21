#include "graph.h"
#include "generators/generator.h"
#include <iostream>
#include <emscripten/bind.h>

using namespace emscripten;

igraph_t globalGraph;
igraph_vector_t globalWeights;

// The first graph to be rendered on the screen
val initRandomGraph(void)
{
    igraph_set_attribute_table(&igraph_cattribute_table);

    igraph_empty(&globalGraph, 10, IGRAPH_UNDIRECTED);

    const char *cityNames[10] = {
        "London", "Paris", "Berlin", "Rome", "Madrid",
        "Athens", "Amsterdam", "Brussels", "Lisbon", "Prague"};
    const double lat[10] = {
        51.5074, 48.8566, 52.5200, 41.9028, 40.4168, 37.9838,
        52.3676, 50.8503, 38.7223, 50.0755};
    const double lon[10] = {
        -0.1278, 2.3522, 13.4050, 12.4964, -3.7038, 23.7275,
        4.9041, 4.3517, -9.1393, 14.4378};
    const int population[10] = {
        9000000, 2148000, 3769000, 2873000, 3223000, 664000,
        872000, 1860000, 545000, 1309000};

    for (int i = 0; i < 10; i++)
    {
        val attrs = val::object();
        attrs.set("latitude", std::to_string(lat[i]));
        attrs.set("longitude", std::to_string(lon[i]));
        attrs.set("population", std::to_string(population[i]));

        // Create the node with label, tableName, and extra attributes
        create_node(&globalGraph, i, cityNames[i], "City", attrs);
    }

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
    result.set("nodes", graph_nodes(&globalGraph));
    result.set("edges", graph_edges(&globalGraph));
    result.set("directed", false);
    return result;
}

void cleanupGraph(void)
{
    igraph_destroy(&globalGraph);
    igraph_vector_destroy(&globalWeights);
}

void test()
{
    // test an exception
    throw std::runtime_error("This is a test exception");
    std::cout << "This is a test" << std::endl;
}

val what_to_stderr(intptr_t ptr)
{
    auto error = reinterpret_cast<std::runtime_error *>(ptr);
    return val(error->what());
}

val create_graph_from_kuzu_to_igraph(
    igraph_integer_t nodes,
    val src_js,            // Int32Array
    val dst_js,            // Int32Array
    igraph_bool_t directed,
    val weight_js          // Float64Array or undefined
) {
    igraph_set_attribute_table(&igraph_cattribute_table);

    static bool graph_initialized = false;
    static bool weights_initialized = false;

    if (graph_initialized) {
        igraph_destroy(&globalGraph);
        graph_initialized = false;
    }

    igraph_error_t rc = igraph_empty(&globalGraph, nodes, directed ? IGRAPH_DIRECTED : IGRAPH_UNDIRECTED);
    if (rc != IGRAPH_SUCCESS) {
        throw std::runtime_error(std::string("igraph_empty failed: ") + igraph_strerror(rc));
    }
    graph_initialized = true;

    const int edge_count = src_js["length"].as<int>();
    for (int i = 0; i < edge_count; i++) {
        const igraph_integer_t s = src_js[i].as<int>();
        const igraph_integer_t t = dst_js[i].as<int>();
        rc = igraph_add_edge(&globalGraph, s, t);
        if (rc != IGRAPH_SUCCESS) {
            igraph_destroy(&globalGraph);
            graph_initialized = false;
            throw std::runtime_error(std::string("igraph_add_edge failed: ") + igraph_strerror(rc));
        }
    }

    if (weights_initialized) {
        igraph_vector_destroy(&globalWeights);
        weights_initialized = false;
    }

    if (!weight_js.isUndefined() && !weight_js.isNull()) {
        const int weight_count = weight_js["length"].as<int>();
        rc = igraph_vector_init(&globalWeights, edge_count);
        if (rc != IGRAPH_SUCCESS) {
            igraph_destroy(&globalGraph);
            graph_initialized = false;
            throw std::runtime_error(std::string("igraph_vector_init failed: ") + igraph_strerror(rc));
        }
        weights_initialized = true;

        for (int i = 0; i < edge_count; i++) {
            double w = (i < weight_count) ? weight_js[i].as<double>() : 0.0;
            VECTOR(globalWeights)[i] = w;
        }
        igraph_cattribute_EAN_setv(&globalGraph, "weight", &globalWeights);
    } // else: no-op; BFS ignores weights

    return bfs(0);
}
// val bfs_on_graph(igraph_t* graph, igraph_integer_t src)
// {
//     IGraphVectorInt order, layers;
//     int N, nodes_remaining, orderLength;

//     igraph_bfs_simple(graph, src, IGRAPH_OUT, order.vec(), layers.vec(), NULL);

//     val result = val::object();
//     val colorMap = val::object();
//     val data = val::object();
//     data.set("algorithm", "Breadth-First Search");

//     data.set("source", igraph_get_name(src));

//     N = igraph_vcount(graph);
//     nodes_remaining = N;
//     bool new_iteration = true;
//     orderLength = order.size();
//     igraph_integer_t current_layer = 0;
//     int nodes_found = 0;

//     val layersArray = val::array();
//     std::unordered_map<int, int> fm;

//     val layerArray = val::array();
//     int layer_index;
//     for (igraph_integer_t i = 0; i < orderLength; ++i)
//     {
//         if (new_iteration)
//         {
//             layerArray = val::array();
//             layer_index = 0;
//             new_iteration = false;
//         }

//         int nodeId = order.at(i);
//         layerArray.set(layer_index++, igraph_get_name(nodeId));
//         fm[nodeId] = nodes_remaining;
//         nodes_found++;

//         int layer = layers.at(current_layer + 1);
//         if (i + 1 == layer || i + 1 == orderLength)
//         {
//             val l = val::object();
//             l.set("layer", layerArray);
//             l.set("index", current_layer);
//             layersArray.set(current_layer++, l);

//             nodes_remaining = N - i - 1;
//             new_iteration = true;
//         }
//     }
//     frequenciesToColorMap(fm, colorMap);
//     result.set("colorMap", colorMap);
//     result.set("mode", MODE_COLOR_SHADE_ERROR);

//     data.set("nodesFound", nodes_found);
//     data.set("layers", layersArray);
//     result.set("data", data);
//     return result;
// }

// val create_graph_from_kuzu_to_igraph(
//     igraph_integer_t nodes,
//     val src_js,            // Int32Array
//     val dst_js,            // Int32Array
//     igraph_bool_t directed,
//     val weight_js          // Float64Array or undefined
// ) {
//     // Set up attribute table
//     igraph_set_attribute_table(&igraph_cattribute_table);
    
//     // Create local graph
//     igraph_t localGraph;
//     igraph_vector_t localWeights;
    
//     // Initialize local structures
//     igraph_empty(&localGraph, nodes, directed ? IGRAPH_DIRECTED : IGRAPH_UNDIRECTED);
//     igraph_vector_init(&localWeights, 0);
    
//     // Get the edge arrays from JavaScript
//     int edge_count = src_js["length"].as<int>();
    
//     // Add edges
//     for (int i = 0; i < edge_count; i++) {
//         int src_id = src_js[i].as<int>();
//         int dst_id = dst_js[i].as<int>();
//         igraph_add_edge(&localGraph, src_id, dst_id);
//     }
    
//     // Set edge weights if provided
//     if (!weight_js.isUndefined() && !weight_js.isNull()) {
//         int weight_count = weight_js["length"].as<int>();
//         igraph_vector_resize(&localWeights, edge_count);
        
//         // Copy weights from JavaScript array
//         for (int i = 0; i < weight_count && i < edge_count; i++) {
//             double weight = weight_js[i].as<double>();
//             VECTOR(localWeights)[i] = weight;
//         }
        
//         // Set the weight attribute on edges
//         igraph_cattribute_EAN_setv(&localGraph, "weight", &localWeights);
//     }
    
//     // Run BFS algorithm starting from node 0
//     val bfsResult = bfs_on_graph(&localGraph, 0);
    
//     // Clean up local resources
//     igraph_destroy(&localGraph);
//     igraph_vector_destroy(&localWeights);
    
//     return bfsResult;
// }


EMSCRIPTEN_BINDINGS(graph)
{
    register_vector<uint8_t>("VectorUint8");

    // Expose the functions
    function("initRandomGraph", &initRandomGraph);
    function("test", &test);
    function("what_to_stderr", &what_to_stderr);

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

    function("create_graph_from_kuzu_to_igraph", &create_graph_from_kuzu_to_igraph);
}

// emcc demo.cpp -O3 -s WASM=1 -s -sEXPORTED_FUNCTIONS=_sum,_subtract --no-entry -o demo.wasm
// em++ -Os graph.cpp -s WASM=1 -o graph.js -s EXPORTED_RUNTIME_METHODS='["cwrap"]' -I./igraph/build/include -I./igraph/include ./igraph/build/src/libigraph.a -lembind --no-entry
// em++ -Os graph.cpp -s WASM=1 -o graph.js -s -I./igraph/build/include -I./igraph/include ./igraph/build/src/libigraph.a -lembind --no-entry -s EXPORT_ES6=1 -s MODULARIZE=1
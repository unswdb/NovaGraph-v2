#include "../graph.h"
#include <iostream>
#include <string>

// DIJKSTRA

val dijkstra_source_to_target(igraph_integer_t src, igraph_integer_t tar) {
    IGraphVectorInt vertices, edges;
    bool hasWeights = VECTOR(globalWeights) != NULL;
    int edges_count = 0;
    int total_weight = 0;

    igraph_get_shortest_path_dijkstra(&globalGraph, vertices.vec(), edges.vec(), src, tar, igraph_weights(), IGRAPH_OUT);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Dijkstra Single Path");

    data.set("source", igraph_get_name(src));
    data.set("target", igraph_get_name(tar));
    data.set("weighted", hasWeights);

    val path = val::array();
    for (int i = 0; i < vertices.size(); ++i) {
        int node = vertices.at(i);
        std::string nodeId = std::to_string(node);
        colorMap.set(nodeId, 0.5);

        if (i > 0) {
            std::string linkId = std::to_string(vertices.at(i-1)) + '-' + nodeId;
            colorMap.set(linkId, 1);

            val link = val::object();
            link.set("from", igraph_get_name(vertices.at(i-1)));
            link.set("to", igraph_get_name(node));

            int weight_index = edges.at(edges_count++);
            if (hasWeights) {
                link.set("weight", VECTOR(globalWeights)[weight_index]);
                total_weight += VECTOR(globalWeights)[weight_index];
            };

            path.set(i-1, link);
        }
    }
    colorMap.set(src, 1);
    colorMap.set(tar, 1);

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("path", path);
    if (hasWeights) data.set("totalWeight", total_weight);
    result.set("data", data);
    return result;
}

val dijkstra_source_to_all(igraph_integer_t src) {
    IGraphVectorIntList paths, edges;
    bool hasWeights = VECTOR(globalWeights) != NULL;

    igraph_get_shortest_paths_dijkstra(&globalGraph, paths.vec(), edges.vec(), src, igraph_vss_all(), igraph_weights(), IGRAPH_OUT, NULL, NULL);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Dijkstra Single Source");

    data.set("source", igraph_get_name(src));
    data.set("weighted", hasWeights);

    val pathsArray = val::array();
    int paths_count = 0;
    std::unordered_map<int, int> fm;
    for (long i = 0; i < paths.size(); ++i) {
        igraph_vector_int_t p = paths.at(i);
        igraph_vector_int_t e = edges.at(i);
        int edges_count = 0;
        int path_weight = 0;
        val pathDetails = val::object();

        int pLength = igraph_vector_int_size(&p);
        igraph_integer_t dest = VECTOR(p)[pLength - 1];

        // skip if path is to itself or if unreachable
        if (dest == src || pLength == 0) continue;

        pathDetails.set("target", igraph_get_name(dest));
        val pathArray = val::array();
        for (long j = 0; j < pLength; ++j) {
            int node = VECTOR(p)[j];
            std::string nodeId = std::to_string(node);

            if (j > 0) {
                std::string linkId = std::to_string(VECTOR(p)[j-1]) + '-' + nodeId;
                colorMap.set(linkId, 1);
                
                int weight_index = VECTOR(e)[edges_count++];
                if (hasWeights) {
                    path_weight += VECTOR(globalWeights)[weight_index];
                }
                
            }
            if (node != src) fm[node]++;
            pathArray.set(j, igraph_get_name(node));
        }

        if (hasWeights) pathDetails.set("weight", path_weight);
        pathDetails.set("path", pathArray);
        pathsArray.set(paths_count++, pathDetails);
    }
    frequenciesToColorMap(fm, colorMap);
    colorMap.set(src, 1);
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_ERROR);

    data.set("paths", pathsArray);
    result.set("data", data);
    return result;
}


// A*
// ??

// Yen
val yen_source_to_target(igraph_integer_t src, igraph_integer_t tar, igraph_integer_t k) {
    IGraphVectorIntList paths, edges;
    bool hasWeights = VECTOR(globalWeights) != NULL;
    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Yen's k Shortest Paths");
    
    igraph_get_k_shortest_paths(&globalGraph, igraph_weights(), paths.vec(), edges.vec(), k, src, tar, IGRAPH_OUT);

    data.set("source", igraph_get_name(src));
    data.set("target", igraph_get_name(tar));
    data.set("k", k);
    data.set("weighted", hasWeights);
    
    val pathsArray = val::array();
    for (long i = 0; i < paths.size(); ++i) {
        igraph_vector_int_t p = paths.at(i);
        igraph_vector_int_t e = edges.at(i);
        int path_weight = 0;

        val pathDetails = val::object();
        pathDetails.set("num", i + 1);
        val pathArray = val::array();
        for (long j = 0; j < igraph_vector_int_size(&p); ++j) {
            int node = VECTOR(p)[j];
            std::string nodeId = std::to_string(node);

            if (j > 0) {
                std::string linkId = std::to_string(VECTOR(p)[j-1]) + '-' + nodeId;
                colorMap.set(linkId, 1);
                
                int weight_index = VECTOR(e)[j-1];
                if (hasWeights) {
                    path_weight += VECTOR(globalWeights)[weight_index];
                }
            }
            colorMap.set(nodeId, 0.5);
            pathArray.set(j, igraph_get_name(node));
        }
        if (hasWeights) pathDetails.set("weight", path_weight);
        pathDetails.set("path", pathArray);
        pathsArray.set(i, pathDetails);
    }

    colorMap.set(src, 1);
    colorMap.set(tar, 1);
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);

    data.set("paths", pathsArray);
    result.set("data", data);
    return result;
}

    
// BELLMAN-FORD

val bf_source_to_target(igraph_integer_t src, igraph_integer_t tar) {
    IGraphVectorInt vertices, edges;
    bool hasWeights = VECTOR(globalWeights) != NULL;
    int edges_count = 0;
    int total_weight = 0;

    igraph_get_shortest_path_bellman_ford(&globalGraph, vertices.vec(), edges.vec(), src, tar, igraph_weights(), IGRAPH_OUT);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Bellman-Ford Single Path");

    data.set("source", igraph_get_name(src));
    data.set("target", igraph_get_name(tar));
    data.set("weighted", hasWeights);
    
    val path = val::array();
    for (int i = 0; i < vertices.size(); ++i) {
        int node = vertices.at(i);
        std::string nodeId = std::to_string(node);
        colorMap.set(nodeId, 0.5);

        if (i > 0) {
            std::string linkId = std::to_string(vertices.at(i-1)) + '-' + nodeId;
            colorMap.set(linkId, 1);
            
            val link = val::object();
            link.set("from", igraph_get_name(vertices.at(i-1)));
            link.set("to", igraph_get_name(node));

            int weight_index = edges.at(edges_count++);
            if (hasWeights) {
                link.set("weight", VECTOR(globalWeights)[weight_index]);
                total_weight += VECTOR(globalWeights)[weight_index];
            };

            path.set(i-1, link);
        }
    }
    colorMap.set(src, 1);
    colorMap.set(tar, 1);

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("path", path);
    if (hasWeights) data.set("totalWeight", total_weight);
    result.set("data", data);
    return result;
}

val bf_source_to_all(igraph_integer_t src) {
    IGraphVectorIntList paths, edges;
    bool hasWeights = VECTOR(globalWeights) != NULL;

    igraph_get_shortest_paths_bellman_ford(&globalGraph, paths.vec(), edges.vec(), src, igraph_vss_all(), igraph_weights(), IGRAPH_OUT, NULL, NULL);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Bellman-Ford Single Source");

    data.set("source", igraph_get_name(src));
    data.set("weighted", hasWeights);

    val pathsArray = val::array();
    int paths_count = 0;
    std::unordered_map<int, int> fm;
    for (long i = 0; i < paths.size(); ++i) {
        igraph_vector_int_t p = paths.at(i);
        igraph_vector_int_t e = edges.at(i);
        int edges_count = 0;
        int path_weight = 0;
        val pathDetails = val::object();

        int pLength = igraph_vector_int_size(&p);
        igraph_integer_t dest = VECTOR(p)[pLength - 1];

        if (dest == src || pLength == 0) continue;

        pathDetails.set("target", igraph_get_name(dest));
        val pathArray = val::array();
        for (long j = 0; j < pLength; ++j) {
            int node = VECTOR(p)[j];
            std::string nodeId = std::to_string(node);

            if (j > 0) {
                std::string linkId = std::to_string(VECTOR(p)[j-1]) + '-' + nodeId;
                colorMap.set(linkId, 1);
                
                int weight_index = VECTOR(e)[edges_count++];
                if (hasWeights) {
                    path_weight += VECTOR(globalWeights)[weight_index];
                }
            }
            if (node != src) fm[node]++;
            pathArray.set(j, igraph_get_name(node));
        }
        if (hasWeights) pathDetails.set("weight", path_weight);
        pathDetails.set("path", pathArray);
        pathsArray.set(paths_count++, pathDetails);
    }
    frequenciesToColorMap(fm, colorMap);
    colorMap.set(src, 1);
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_ERROR);

    data.set("paths", pathsArray);
    result.set("data", data);
    return result;
}


// BFS
val bfs(igraph_integer_t src) {
    IGraphVectorInt order, layers;
    int N, nodes_remaining, orderLength;

    igraph_bfs_simple(&globalGraph, src, IGRAPH_OUT, order.vec(), layers.vec(), NULL);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Breadth-First Search");

    data.set("source", igraph_get_name(src));

    N = igraph_vcount(&globalGraph);
    nodes_remaining = N;
    bool new_iteration = true;
    orderLength = order.size();
    igraph_integer_t current_layer = 0;
    int nodes_found = 0;

    val layersArray = val::array();
    std::unordered_map<int, int> fm;

    val layerArray = val::array();
    int layer_index;
    for (igraph_integer_t i = 0; i < orderLength; ++i) {
        if (new_iteration) {
            layerArray = val::array();
            layer_index = 0;
            new_iteration = false;
        }

        int nodeId = order.at(i);
        layerArray.set(layer_index++, igraph_get_name(nodeId));
        fm[nodeId] = nodes_remaining;
        nodes_found++;

        int layer = layers.at(current_layer + 1);    
        if (i + 1 == layer || i + 1 == orderLength) {
            val l = val::object();
            l.set("layer", layerArray);
            l.set("index", current_layer);
            layersArray.set(current_layer++, l);

            nodes_remaining = N - i - 1;
            new_iteration = true;
        }
    }
    frequenciesToColorMap(fm, colorMap);
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_ERROR);

    data.set("nodesFound", nodes_found);
    data.set("layers", layersArray);
    result.set("data", data);
    return result;
}


val dfs(igraph_integer_t src) {
    IGraphVectorInt order, dist, order_out;

    igraph_dfs(&globalGraph, src, IGRAPH_OUT, false, order.vec(), order_out.vec(), NULL, dist.vec(), NULL, NULL, NULL);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Depth-First Search");

    data.set("source", igraph_get_name(src));

    val subtrees = val::array();
    std::unordered_set<int> visited;
    val tree = val::array();
    int tree_index;
    int subtree_index = 0;

    std::unordered_map<int, int> fm;
    for (igraph_integer_t i = 0; i < order_out.size(); ++i) {
        int node = order_out.at(i);
        if (visited.find(node) == visited.end()) {
            tree = val::array();
            tree_index = 0;
            for (igraph_integer_t j; j < order.size(); ++j) {
                int orderNode = order.at(j);
                //std::cout << " " << std::endl;
                if (visited.find(orderNode) != visited.end()) continue;
                
                visited.insert(orderNode);
                fm[orderNode] = subtree_index;
                tree.set(tree_index++, igraph_get_name(orderNode));
                if (orderNode == node) break;
            }

            if (tree_index > 0) {
                val t = val::object();
                t.set("num", subtree_index + 1);
                t.set("tree", tree);
                subtrees.set(subtree_index++, t);
            }
        }
    }

    // map function over fm: value => (subtree_index - value)
    for (auto& kv: fm) kv.second = subtree_index - kv.second + 1;

    frequenciesToColorMap(fm, colorMap);

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_ERROR);
    data.set("nodesFound", visited.size());
    data.set("subtrees", subtrees);
    result.set("data", data);
    return result;
}


val randomWalk(igraph_integer_t start, int steps) {
    IGraphVectorInt vertices, edges;
    bool hasWeights = VECTOR(globalWeights) != NULL;

    igraph_random_walk(&globalGraph, NULL, vertices.vec(), edges.vec(), start, IGRAPH_OUT, steps, IGRAPH_RANDOM_WALK_STUCK_RETURN);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Random Walk");

    data.set("source", igraph_get_name(start));
    data.set("steps", steps);
    data.set("weighted", hasWeights);

    val path = val::array();
    std::unordered_map<int, int> fm;
    int highestFrequency = 0;
    int highestFrequencyNode = 0;
    for (int i = 0; i < vertices.size(); ++i) {
        int node = vertices.at(i);
        fm[node]++;
        if (fm[node] > highestFrequency) {
            highestFrequency = fm[node];
            highestFrequencyNode = node;
        }

        std::string nodeId = std::to_string(node);

        if (i > 0) {
            std::string linkId = std::to_string(vertices.at(i-1)) + '-' + nodeId;
            colorMap.set(linkId, 1);
            
            val link = val::object();
            link.set("step", i);
            link.set("from", igraph_get_name(vertices.at(i-1)));
            link.set("to", igraph_get_name(node));
            if (hasWeights) {
                int weight_index = edges.at(i-1);
                link.set("weight", VECTOR(globalWeights)[weight_index]);
            }
            path.set(i-1, link);
        }
    }

    data.set("maxFrequencyNode", igraph_get_name(highestFrequencyNode));
    data.set("maxFrequency", highestFrequency);
    
    frequenciesToColorMap(fm, colorMap);
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("path", path);
    result.set("data", data);
    return result;
}


val min_spanning_tree(void) {
    IGraphVectorInt edges;
    bool hasWeights = VECTOR(globalWeights) != NULL;

    igraph_minimum_spanning_tree(&globalGraph, edges.vec(), igraph_weights());

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Minimum Spanning Tree");

    data.set("weighted", hasWeights);
    data.set("maxEdges", igraph_ecount(&globalGraph));

    int total_weight = 0;
    val edgesArray = val::array();
    for (int i = 0; i < edges.size(); ++i) {
        val link = val::object();
        int edge = edges.at(i);
        igraph_integer_t from, to;
        igraph_edge(&globalGraph, edge, &from, &to);

        std::string linkId = std::to_string(from) + '-' + std::to_string(to);
        colorMap.set(from, 0.5);
        colorMap.set(to, 0.5);
        colorMap.set(linkId, 1);

        link.set("num", i + 1);
        link.set("from", igraph_get_name(from));
        link.set("to", igraph_get_name(to));
        if (hasWeights) {
            link.set("weight", VECTOR(globalWeights)[edge]);
            total_weight += VECTOR(globalWeights)[edge];
        }

        edgesArray.set(i, link);
    }
    if (hasWeights) data.set("totalWeight", total_weight);

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_ERROR);
    data.set("edges", edgesArray);
    result.set("data", data);
    return result;
}

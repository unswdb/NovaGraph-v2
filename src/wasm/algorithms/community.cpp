#include "../graph.h"
#include <iostream>
#include <string>

void throw_error_if_directed(const std::string& algorithm) {
    if (igraph_is_directed(&globalGraph)) {
        std::string message = "The " + algorithm + " algorithm does not support directed graphs";
        throw std::runtime_error(message);
    }
}

void throw_error_if_undirected(const std::string& algorithm) {
    if (!igraph_is_directed(&globalGraph)) {
        std::string message = "The " + algorithm + " algorithm does not support undirected graphs";
        throw std::runtime_error(message);
    }
}

val louvain(igraph_real_t resolution) {
    IGraphVectorInt membership;
    IGraphVector modularity;
    igraph_real_t modularity_metric;
    std::stringstream stream;

    throw_error_if_directed("Louvain");
    igraph_community_multilevel(&globalGraph, igraph_weights(), resolution, membership.vec(), NULL, modularity.vec());
    igraph_modularity(&globalGraph, membership.vec(), igraph_weights(), resolution, IGRAPH_DIRECTED, &modularity_metric);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Louvain Community Detection");


    stream << std::fixed << std::setprecision(2) << modularity_metric;
    data.set("modularity", std::stod(stream.str()));
    
    std::map<int, std::vector<std::string>> communityMap;
    for (igraph_integer_t v = 0; v < membership.size(); ++v) {
        igraph_integer_t community = membership.at(v);
        colorMap.set(v, community);
        communityMap[community].push_back(igraph_get_name(v));
    }

    val communities = val::array();
    for (const auto& [community, vertices] : communityMap) {
        communities.set(community, val::array(vertices));
    }

    result.set("colorMap", colorMap);
    result.set("mode", MODE_RAINBOW);
    data.set("communities", communities);
    result.set("data", data);
    return result;
}

val leiden(igraph_real_t resolution) {
    igraph_integer_t n_iterations = 100;
    IGraphVectorInt membership;
    igraph_real_t quality, modularity_metric;
    std::stringstream stream, stream2;

    throw_error_if_directed("Leiden");
    igraph_community_leiden(&globalGraph, igraph_weights(), NULL, resolution, 0.01, false, n_iterations, membership.vec(), NULL, &quality);
    igraph_modularity(&globalGraph, membership.vec(), igraph_weights(), resolution, IGRAPH_DIRECTED, &modularity_metric);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Leiden Community Detection");


    stream << std::fixed << std::setprecision(2) << modularity_metric;
    data.set("modularity", std::stod(stream.str()));

    stream2 << std::fixed << std::setprecision(2) << quality;
    data.set("quality", std::stod(stream2.str()));

    std::map<int, std::vector<std::string>> communityMap;
    for (igraph_integer_t v = 0; v < membership.size(); ++v) {
        igraph_integer_t community = membership.at(v);
        colorMap.set(v, community);
        communityMap[community].push_back(igraph_get_name(v));
    }

    val communities = val::array();
    for (const auto& [community, vertices] : communityMap) {
        communities.set(community, val::array(vertices));
    }

    result.set("colorMap", colorMap);
    result.set("mode", MODE_RAINBOW);
    data.set("communities", communities);
    result.set("data", data);
    return result;
}

val fast_greedy(void) {
    IGraphVectorInt membership;
    IGraphVector modularity;
    std::stringstream stream;

    throw_error_if_directed("Fast-Greedy");
    igraph_community_fastgreedy(&globalGraph, igraph_weights(), NULL, modularity.vec(), membership.vec());

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Fast-Greedy Community Detection");

    stream << std::fixed << std::setprecision(2) << modularity.max();
    data.set("modularity", std::stod(stream.str()));

    std::map<int, std::vector<std::string>> communityMap;
    for (igraph_integer_t v = 0; v < membership.size(); ++v) {
        igraph_integer_t community = membership.at(v);
        colorMap.set(v, community);
        communityMap[community].push_back(igraph_get_name(v));
    }

    val communities = val::array();
    for (const auto& [community, vertices] : communityMap) {
        communities.set(community, val::array(vertices));
    }
    
    result.set("colorMap", colorMap);
    result.set("mode", MODE_RAINBOW);
    data.set("communities", communities);
    result.set("data", data);
    return result;
}

val label_propagation(void) {
    IGraphVectorInt membership;

    igraph_community_label_propagation(&globalGraph, membership.vec(), IGRAPH_OUT, igraph_weights(), NULL, NULL);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Label Propagation");

    std::map<int, std::vector<std::string>> communityMap;
    for (igraph_integer_t v = 0; v < membership.size(); ++v) {
        igraph_integer_t community = membership.at(v);
        colorMap.set(v, community);
        communityMap[community].push_back(igraph_get_name(v));
    }

    val communities = val::array();
    for (const auto& [community, vertices] : communityMap) {
        communities.set(community, val::array(vertices));
    }

    result.set("colorMap", colorMap);
    result.set("mode", MODE_RAINBOW);
    data.set("communities", communities);
    result.set("data", data);
    return result;
}

val local_clustering_coefficient(void) {
    IGraphVector res;

    igraph_transitivity_local_undirected(&globalGraph, res.vec(), igraph_vss_all(), IGRAPH_TRANSITIVITY_ZERO);

    igraph_real_t global_transitivity = res.avg_ignore_zeros();
    double max_transitivity = res.max_nonan();
    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Local Clustering Coefficient");

    std::stringstream s;
    s << std::fixed << std::setprecision(4) << global_transitivity;
    data.set("global_coefficient", std::stod(s.str()));

    val transitivities = val::array();
    std::unordered_map<int, double> dm;
    for (igraph_integer_t v = 0; v < res.size(); ++v) {
        val t = val::object();
        double transitivity = res.at(v);

        std::stringstream stream;
        stream << std::fixed << std::setprecision(4) << transitivity;

        dm[v] = transitivity;
        t.set("id", v);
        t.set("node", igraph_get_name(v));
        t.set("value", std::stod(stream.str()));
        transitivities.set(v, t);
    }
    doublesToColorMap(dm, colorMap);

    data.set("coefficients", transitivities);
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    result.set("data", data);
    return result;
}

val k_core(int k) {
    IGraphVectorInt coreness, vertices_to_keep;
    igraph_coreness(&globalGraph, coreness.vec(), IGRAPH_OUT);

    for (igraph_integer_t v = 0; v < coreness.size(); ++v) {
        if (coreness.at(v) >= k) {
            vertices_to_keep.push_back(v);
        }
    }

    // Create a map to store the original vertex IDs
    std::map<igraph_integer_t, igraph_integer_t> original_ids;
    for (int i = 0; i < vertices_to_keep.size(); i++) {
        original_ids[i] = vertices_to_keep.at(i);
    }

    // create induced subgraph
    igraph_t subgraph;
    igraph_vs_t vs;
    igraph_vs_vector(&vs, vertices_to_keep.vec());
    igraph_induced_subgraph(&globalGraph, &subgraph, vs, IGRAPH_SUBGRAPH_AUTO);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "K-Core Detection");

    for (igraph_integer_t e = 0; e < igraph_ecount(&subgraph); ++e) {
        igraph_integer_t from, to;
        igraph_edge(&subgraph, e, &from, &to);

        int from_id = original_ids[from];
        int to_id = original_ids[to];
        
        std::string linkId = std::to_string(from_id) + "-" + std::to_string(to_id);
        colorMap.set(linkId, 1);
        colorMap.set(from_id, 0.5);
        colorMap.set(to_id, 0.5);
    }

    val cores = val::array();
    for (igraph_integer_t i = 0; i < vertices_to_keep.size(); ++i) {
        igraph_integer_t v = vertices_to_keep.at(i);
        val node = val::object();
        node.set("id", v);
        node.set("node", igraph_get_name(v));
        cores.set(v, node);
    }
    data.set("cores", cores);
    data.set("k", k);
    data.set("max_coreness", coreness.max());
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    result.set("data", data);

    igraph_destroy(&subgraph);
    igraph_vs_destroy(&vs);
    return result;

}

val triangles(void) {
    IGraphVectorInt res;

    igraph_list_triangles(&globalGraph, res.vec());

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Triangle Count");

    val triangles = val::array();
    int id = 1;
    for (igraph_integer_t v = 0; v < res.size(); v += 3) {
        val t = val::object();
        t.set("node1", igraph_get_name(res.at(v)));
        t.set("node2", igraph_get_name(res.at(v + 1)));
        t.set("node3", igraph_get_name(res.at(v + 2)));
        t.set("id", id++);
        triangles.set(v, t);

        colorMap.set(res.at(v), 0.5);
        colorMap.set(res.at(v + 1), 0.5);
        colorMap.set(res.at(v + 2), 0.5);

        std::string linkId1 = std::to_string(res.at(v)) + "-" + std::to_string(res.at(v + 1));
        std::string linkId2 = std::to_string(res.at(v + 1)) + "-" + std::to_string(res.at(v + 2));
        std::string linkId3 = std::to_string(res.at(v + 2)) + "-" + std::to_string(res.at(v));
        colorMap.set(linkId1, 1);
        colorMap.set(linkId2, 1);
        colorMap.set(linkId3, 1);
    }

    data.set("triangles", triangles);
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    result.set("data", data);
    return result;
}

val connected_components(igraph_connectedness_t mode) {
    IGraphVectorInt membership;

    igraph_connected_components(&globalGraph, membership.vec(), NULL, NULL, mode);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    if (mode == IGRAPH_STRONG) {
        data.set("algorithm", "Strongly Connected Components");
    } else {
        data.set("algorithm", "Weakly Connected Components");
    }

    std::map<int, std::vector<std::string>> componentMap;
    for (igraph_integer_t v = 0; v < membership.size(); ++v) {
        igraph_integer_t component = membership.at(v);
        colorMap.set(v, component);
        componentMap[component].push_back(igraph_get_name(v));
    }

    val components = val::array();
    for (const auto& [component, vertices] : componentMap) {
        components.set(component, val::array(vertices));
    }

    result.set("colorMap", colorMap);
    result.set("mode", MODE_RAINBOW);
    data.set("components", components);
    result.set("data", data);
    return result;
}

val strongly_connected_components(void) {
    return connected_components(IGRAPH_STRONG);
}

val weakly_connected_components(void) {
    throw_error_if_undirected("Weakly Connected Components");
    return connected_components(IGRAPH_WEAK);
}
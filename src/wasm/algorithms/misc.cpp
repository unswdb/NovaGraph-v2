#include "../graph.h"
#include <iostream>

val vertices_are_adjacent(igraph_integer_t src, igraph_integer_t tar) {
    igraph_bool_t res;
    bool hasWeights = VECTOR(globalWeights) != NULL;

    igraph_are_connected(&globalGraph, src, tar, &res);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Check Adjacency");

    data.set("source", igraph_get_name(src));
    data.set("target", igraph_get_name(tar));
    colorMap.set(src, 1);
    colorMap.set(tar, 1);

    if (res) {
        std::string linkId = std::to_string(src) + '-' + std::to_string(tar);
        colorMap.set(linkId, 1);
        if (hasWeights) {
            igraph_integer_t eid;
            igraph_get_eid(&globalGraph, &eid, src, tar, true, 0);
            double weight = VECTOR(globalWeights)[eid];
            data.set("weight", weight);
        }
    }

    data.set("adjacent", res);
    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    result.set("data", data);
    return result;
}

val jaccard_similarity(val js_vs_list) {
    IGraphVectorInt vs_list;
    IGraphMatrix m;
    igraph_vs_t vs;

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Jaccard Similarity");

    val nodes = val::array();
    for (size_t i = 0; i < js_vs_list["length"].as<size_t>(); i++) {
        igraph_integer_t nodeId = js_vs_list[i].as<igraph_integer_t>();
        nodes.set(i, igraph_get_name(nodeId));
        colorMap.set(nodeId, 1);
        vs_list.push_back(nodeId);
    }

    igraph_vs_vector(&vs, vs_list.vec());
    igraph_similarity_jaccard(&globalGraph, m.mat(), vs, IGRAPH_OUT, false);

    val rows = val::array();
    double max_similarity = -1.0;
    val max_pair = val::object();
    for (long int i = 0; i < m.nrows(); i++) {
        val row = val::array();
        for (long int j = 0; j < m.ncols(); j++) {
            std::stringstream stream;
            stream << std::fixed << std::setprecision(2) << m.get(i, j);
            double similarity = atof(stream.str().c_str());
            row.set(j, similarity);

            if (similarity > max_similarity && i != j) {
                max_similarity = similarity;
                int nodeId1 = vs_list.at(i);
                int nodeId2 = vs_list.at(j);
                max_pair.set("node1", igraph_get_name(nodeId1));
                max_pair.set("node2", igraph_get_name(nodeId2));
                max_pair.set("similarity", similarity);
            }
        }
        rows.set(i, row);
    }

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("similarityMatrix", rows);
    data.set("maxSimilarity", max_pair);
    data.set("nodes", nodes);
    result.set("data", data);
    igraph_vs_destroy(&vs);
    return result;    
}

val topological_sort(void) {
    igraph_bool_t isDAG;
    igraph_is_dag(&globalGraph, &isDAG);
    if (!isDAG) throw std::runtime_error("This graph is not a Directed Acyclic Graph (DAG) and cannot be topologically sorted.");

    IGraphVectorInt order;
    igraph_topological_sorting(&globalGraph, order.vec(), IGRAPH_OUT);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Topological Sort");

    val nodeOrder = val::array();

    // Node colors will get lighter colours (lower freq values) which will be scaled
    std::unordered_map<int, int> fm;
    int current_fm_value = order.size();
    for (igraph_integer_t v = 0; v < order.size(); v++) {
        val n = val::object();
        igraph_integer_t nodeId = order.at(v);
        n.set("id", nodeId);
        n.set("node", igraph_get_name(nodeId));
        nodeOrder.set(v, n);
        fm[nodeId] = current_fm_value--;
    }
    frequenciesToColorMap(fm, colorMap);

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("order", nodeOrder);
    result.set("data", data);
    return result;
}

val diameter(void) {
    igraph_real_t diameter;
    igraph_integer_t src, tar;
    IGraphVectorInt vPath, ePath;
    bool hasWeights = VECTOR(globalWeights) != NULL;
    igraph_diameter_dijkstra(&globalGraph, igraph_weights(), &diameter, &src, &tar, vPath.vec(), ePath.vec(), true, true);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Diameter");

    data.set("source", igraph_get_name(src));
    data.set("target", igraph_get_name(tar));
    data.set("weighted", hasWeights);
    data.set("diameter", diameter);

    val path = val::array();
    for (int i = 0; i < vPath.size(); ++i) {
        int node = vPath.at(i);
        std::string nodeId = std::to_string(node);
        colorMap.set(nodeId, 0.5);

        if (i > 0) {
            std::string linkId = std::to_string(vPath.at(i-1)) + '-' + nodeId;
            colorMap.set(linkId, 1);

            val link = val::object();
            link.set("from", igraph_get_name(vPath.at(i-1)));
            link.set("to", igraph_get_name(node));

            int weight_index = ePath.at(i-1);
            if (hasWeights) {
                link.set("weight", VECTOR(globalWeights)[weight_index]);
            };
            path.set(i-1, link);
        }
    }
    colorMap.set(src, 1);
    colorMap.set(tar, 1);

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("path", path);
    result.set("data", data);
    return result;
}

val eulerian_path(void) {
    igraph_bool_t exists;
    igraph_is_eulerian(&globalGraph, &exists, NULL);
    if (!exists) throw std::runtime_error("This graph does not have an Eulerian path.");
    
    IGraphVectorInt vPath;
    igraph_eulerian_path(&globalGraph, NULL, vPath.vec());

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Eulerian Path");

    val path = val::array();
    for (int i = 0; i < vPath.size() - 1; ++i) {
        int src = vPath.at(i);
        int tar = vPath.at(i+1);
        std::string linkId = std::to_string(src) + '-' + std::to_string(tar);
        colorMap.set(linkId, 1);

        val link = val::object();
        link.set("from", igraph_get_name(src));
        link.set("to", igraph_get_name(tar));
        path.set(i, link);
    }
    colorMap.set(vPath.at(0), 1);
    colorMap.set(vPath.at(vPath.size()-1), 1);
    data.set("start", igraph_get_name(vPath.at(0)));
    data.set("end", igraph_get_name(vPath.at(vPath.size()-1)));

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("path", path);
    result.set("data", data);
    return result;
}

val eulerian_circuit(void) {
    igraph_bool_t pathExists, circuitExists;
    igraph_is_eulerian(&globalGraph, &pathExists, &circuitExists);
    if (!circuitExists) {
        if (pathExists) {
            throw std::runtime_error("This graph is does not have an Eulerian circuit BUT it has an Eulerian path.");
        } else {
            throw std::runtime_error("This graph does not have an Eulerian circuit.");
        }
    }
    
    IGraphVectorInt vPath;
    igraph_eulerian_cycle(&globalGraph, NULL, vPath.vec());

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "Eulerian Circuit");

    val path = val::array();
    for (int i = 0; i < vPath.size() - 1; ++i) {
        int src = vPath.at(i);
        int tar = vPath.at(i+1);
        std::string linkId = std::to_string(src) + '-' + std::to_string(tar);
        colorMap.set(linkId, 1);

        val link = val::object();
        link.set("from", igraph_get_name(src));
        link.set("to", igraph_get_name(tar));
        path.set(i, link);
    }

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("path", path);
    result.set("data", data);
    return result;
}

val missing_edge_prediction_default_values(void) {
    int num_nodes = igraph_vcount(&globalGraph);
    int num_edges = igraph_ecount(&globalGraph);
    int num_samples, num_bins;
    val result = val::object();

    if (num_nodes < 100) {
        num_samples = 500;
        num_bins = 10;
        result.set("graphSize", "small");
    } else if (num_nodes <= 1000) {
        num_samples = 1000 + (num_edges / 100); // slightly increase based on edge size
        num_bins = 25;
        result.set("graphSize", "medium");
    } else {
        num_samples = 5000 + (num_edges / 50);
        num_bins = 50 + (num_edges / 200);
        result.set("graphSize", "large");
    }

    result.set("numSamples", num_samples);
    result.set("numBins", num_bins);
    return result;
}

val missing_edge_prediction(int numSamples, int numBins) {
    igraph_hrg_t hrg;
    IGraphVectorInt predicted_edges;
    IGraphVector probabilties;

    // fit the hrg model to the global graph
    igraph_hrg_init(&hrg, 0);
    igraph_hrg_fit(&globalGraph, &hrg, false, 0);

    // predict missing edges
    igraph_hrg_predict(&globalGraph, predicted_edges.vec(), probabilties.vec(), &hrg, false, numSamples, numBins);

    val result = val::object();
    val colorMap = val::object();
    val data = val::object();
    data.set("algorithm", "HRG Missing Edge Prediction");

    val edges = val::array();
    val edgesData = val::array();
    int edgeIndex = 0;
    for (int i = 0; i < predicted_edges.size(); ++i) {
        int src = predicted_edges.at(i);
        int tar = predicted_edges.at(i + 1);
        std::string linkId = std::to_string(src) + '-' + std::to_string(tar);
        igraph_real_t prob = probabilties.at(edgeIndex);

        // Only record edges with probability > 0.5
        if (prob < 0.5) break;

        colorMap.set(src, 0.5);
        colorMap.set(tar, 0.5);
        colorMap.set(linkId, 0);
        
        // add to graph render object (used by Cosmograph)
        val e = val::object();
        e.set("source", src);
        e.set("target", tar);
        edges.set(edgeIndex, e);

        // add to data object
        std::stringstream stream;
        val link = val::object();
        link.set("from", igraph_get_name(src));
        link.set("to", igraph_get_name(tar));

        stream << std::fixed << std::setprecision(3) << prob * 100;
        link.set("probability", stream.str() + "%");
        edgesData.set(edgeIndex++, link);
    }

    result.set("colorMap", colorMap);
    result.set("mode", MODE_COLOR_SHADE_DEFAULT);
    data.set("predictedEdges", edgesData);
    result.set("data", data);
    result.set("edges", edges);
    igraph_hrg_destroy(&hrg);
    return result;
}
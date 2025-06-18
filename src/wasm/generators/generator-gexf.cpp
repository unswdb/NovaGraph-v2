#include "generator.h"
#include "../pugixml/src/pugixml.hpp"

val graph_from_gexf(const std::string& filename) {
    pugi::xml_document doc;
    pugi::xml_parse_result parsed = doc.load_file(filename.c_str());
    if (!parsed) throw std::runtime_error("Error parsing GEXF file: " + std::string(parsed.description()));

    pugi::xml_node graph_element = doc.child("gexf").child("graph");
    if (!graph_element) throw std::runtime_error("No graph element found in GEXF file");
    bool directed = graph_element.attribute("defaultedgetype").as_string() == std::string("directed");

    NodeMap nodeMap;
    std::vector<std::string> labels;
    int id = 0;
    for (pugi::xml_node node : graph_element.child("nodes").children("node")) {
        std::string str_id = node.attribute("id").value();
        std::string label = node.attribute("label").value();
        if (label.empty()) label = str_id;

        // check that the node id is unique and label is also unique
        if (nodeMap.find(str_id) != nodeMap.end()) throw std::runtime_error("Duplicate node id found: " + str_id);
        if (std::find(labels.begin(), labels.end(), label) != labels.end()) throw std::runtime_error("Duplicate node label found: " + label);
        
        nodeMap[str_id] = id++;
        labels.push_back(label);
    }

    if (nodeMap.empty()) throw std::runtime_error("No nodes found in the file");

    IGraphVectorInt igraph_edges;
    IGraphVector igraph_weights;
    for (pugi::xml_node edge : graph_element.child("edges").children("edge")) {
        std::string src = edge.attribute("source").value();
        std::string tar = edge.attribute("target").value();
        
        if (nodeMap.find(src) == nodeMap.end() || nodeMap.find(tar) == nodeMap.end()) {
            throw std::runtime_error("Invalid node in edge: " + src + " -> " + tar);
        }

        igraph_edges.push_back(nodeMap[src]);
        igraph_edges.push_back(nodeMap[tar]);

        pugi::xml_attribute weight = edge.attribute("weight");
        if (weight) {
            igraph_weights.push_back(weight.as_double());
        } else {
            igraph_weights.push_back(1);
        }
    }

    igraph_destroy(&globalGraph);
    igraph_create(&globalGraph, igraph_edges.vec(), nodeMap.size(), directed);

    for (int i = 0; i < labels.size(); i++) {
        SETVAS(&globalGraph, "name", i, labels[i].c_str());
    }


    igraph_vector_destroy(&globalWeights);
    igraph_vector_init_copy(&globalWeights, igraph_weights.vec());

    val result = val::object();
    result.set("nodes", graph_nodes());
    result.set("edges", graph_edges());
    result.set("directed", directed);
    return result;
}
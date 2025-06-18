#include "generator.h"
#include "../rapidjson/include/rapidjson/istreamwrapper.h"
#include "../rapidjson/include/rapidjson/document.h"

bool process_json(const std::string& filename) {
    NodeMap nodeMap;
    IGraphVectorInt igraph_edges;
    IGraphVector igraph_weights;
    std::unordered_set<std::string> nodeSet;

    std::ifstream file(filename);
    int id = 0;

    if (!file.is_open()) throw std::runtime_error("Could not open file " + filename);

    rapidjson::IStreamWrapper isw(file);
    rapidjson::Document doc;
    doc.ParseStream(isw);
    file.close();

    if (doc.HasParseError()) throw std::runtime_error("Error parsing JSON file: " + filename);

    const rapidjson::Value& nodes = doc.HasMember("nodes") ? doc["nodes"] : doc["vertices"];
    const rapidjson::Value& edges = doc.HasMember("edges") ? doc["edges"] : doc["links"];
    const rapidjson::Value& directed = doc["directed"];

    // read the nodes which should be an array of strings
    if (!nodes.IsArray()) throw std::runtime_error("Invalid nodes format in JSON file");
    if (!edges.IsArray()) throw std::runtime_error("Invalid edges format in JSON file");
    if (!directed.IsBool()) throw std::runtime_error("Invalid directed format in JSON file");

    for (const auto& node : nodes.GetArray()) {
        if (node.IsString()) {
            std::string name = node.GetString();
            if (nodeSet.insert(name).second) {
                nodeMap[name] = id++;
            }
        }
        // skip invalid nodes
    }

    if (nodeMap.empty()) throw std::runtime_error("No nodes found in the file");

    for (const auto& edge : edges.GetArray()) {
        if (edge.IsObject() && edge.HasMember("source") && edge.HasMember("target")) {
            std::string src = edge["source"].GetString();
            std::string tar = edge["target"].GetString();
            if (nodeMap.find(src) == nodeMap.end() || nodeMap.find(tar) == nodeMap.end()) {
                throw std::runtime_error("Invalid source or target in edge");
            }

            igraph_edges.push_back(nodeMap[src]);
            igraph_edges.push_back(nodeMap[tar]);

            if (edge.HasMember("weight")) {
                if (edge["weight"].IsNumber()) {
                    igraph_weights.push_back(edge["weight"].GetDouble());
                } else {
                    throw std::runtime_error("Invalid weight in edge");
                }
            } else {
                igraph_weights.push_back(1);
            }
        } else {
            throw std::runtime_error("Missing source or target in edge");
        }
    }

    // remove existing graph and create a new one
    igraph_destroy(&globalGraph);
    igraph_create(&globalGraph, igraph_edges.vec(), nodeMap.size(), directed.GetBool());

    // add node names as attributes
    for (auto &pair : nodeMap) {
        SETVAS(&globalGraph, "name", pair.second, pair.first.c_str());
    }

    // store weights in global variable
    igraph_vector_destroy(&globalWeights);
    igraph_vector_init_copy(&globalWeights, igraph_weights.vec());

    return directed.GetBool();
}

val graph_from_json(const std::string& filename) {
    val result = val::object();
    bool directed = process_json(filename);
    result.set("nodes", graph_nodes());
    result.set("edges", graph_edges());
    result.set("directed", directed);
    return result;
}
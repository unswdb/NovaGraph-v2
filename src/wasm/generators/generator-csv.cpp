#include "generator.h"
#include <algorithm>

inline void ltrim(std::string& s) {
    s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](unsigned char ch) {
        return !std::isspace(ch);
    }));
}
inline void rtrim(std::string& s) {
    s.erase(std::find_if(s.rbegin(), s.rend(), [](unsigned char ch) {
        return !std::isspace(ch);
    }).base(), s.end());
}

std::string trim(std::string &s) {
    rtrim(s);
    ltrim(s);
    return s;
}

std::vector<std::string> split(const std::string& s, char delimiter) {
    std::vector<std::string> tokens;
    std::string token;
    std::istringstream tokenStream(s);
    while (std::getline(tokenStream, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}


NodeMap process_nodes_csv(const std::string& filename) {
    NodeMap nodes;
    std::unordered_set<std::string> nodeSet;

    std::ifstream file(filename);
    std::string line, name;
    int id = 0;

    // check file
    if (!file.is_open()) throw std::runtime_error("Could not open file " + filename);

    // header check
    if (!std::getline(file, line)) throw std::runtime_error("Could not read the Nodes CSV header");
    std::string header = trim(line);
    if (header != "nodes" && header != "Nodes") throw std::runtime_error("Incorrect header in nodes file");

    // read the nodes
    while (std::getline(file, line)) {
        std::vector<std::string> tokens = split(trim(line), ',');
        if (tokens.size() < 1) continue;
        name = tokens[0];
        if (nodeSet.insert(name).second) {
            nodes[name] = id++;
        }
    }

    if (nodes.empty()) throw std::runtime_error("No nodes found in the file");

    return nodes;
}

void process_edges_csv(const std::string &edgesFilename, std::unordered_map<std::string, int> &nodeMap, bool directed) {
    std::ifstream file(edgesFilename);
    std::string line, src, tar, weight;
    IGraphVectorInt edges;
    IGraphVector weights;
    bool weighted = false;

    // check if file is open
    if (!file.is_open()) throw std::runtime_error("Could not open file " + edgesFilename);

    // read the csv file and check columns
    if (std::getline(file, line)) {
        std::vector<std::string> tokens = split(trim(line), ',');
        if (tokens.size() < 2 || tokens[0] != "source" || tokens[1] != "target") {
            throw std::runtime_error("Incorrect header in edges file");
        } else if (tokens.size() >= 3 && tokens[2] == "weight") {
            weighted = true;
        }        
    } else {
        throw std::runtime_error("Could not read the Edges CSV headers");
    }

    // read the edges
    while (std::getline(file, line)) {
        std::vector<std::string> tokens = split(trim(line), ',');
        if (tokens.size() < 2) continue; // skip lines with less than 2 columns
        src = tokens[0];
        tar = tokens[1];
        if (nodeMap.find(src) == nodeMap.end() || nodeMap.find(tar) == nodeMap.end()) {
            throw std::runtime_error("Invalid node in edge: " + src + " -> " + tar);
        }

        // add edge to igraph vector using the node id
        edges.push_back(nodeMap[src]);
        edges.push_back(nodeMap[tar]);

        if (weighted) {
            if (tokens.size() < 3) {
                weights.push_back(1); // default weight
            } else {
                weight = tokens[2];
                try {
                    weights.push_back(std::stod(weight));
                } catch (const std::exception& e) {
                    throw std::runtime_error("Invalid weight in edge: " + std::to_string(nodeMap[src]) + " -> " + std::to_string(nodeMap[tar]));
                }
            }
        }
    }

    // remove existing graph and create new
    igraph_destroy(&globalGraph);
    igraph_create(&globalGraph, edges.vec(), nodeMap.size(), directed);   

    // add node names as attributes
    for (auto &pair : nodeMap) {
        SETVAS(&globalGraph, "name", pair.second, pair.first.c_str());
    }

    // store weights in global variable
    igraph_vector_destroy(&globalWeights);
    if (weighted) igraph_vector_init_copy(&globalWeights, weights.vec());
}

val graph_from_csv(const std::string& nodesFilename, const std::string& edgesFilename, bool directed) {
    val result = val::object();
    std::unordered_map<std::string, int> nodeMap = process_nodes_csv(nodesFilename);
    process_edges_csv(edgesFilename, nodeMap, directed);
    result.set("nodes", graph_nodes());
    result.set("edges", graph_edges());
    return result;
}

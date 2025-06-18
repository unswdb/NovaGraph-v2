#ifndef GENERATOR_H
#define GENERATOR_H

#include "../graph.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <unordered_set>

inline void ltrim(std::string& s);
inline void rtrim(std::string& s);
std::string trim(std::string &s);
std::vector<std::string> split(const std::string& s, char delimiter);

typedef std::unordered_map<std::string, int> NodeMap;

NodeMap process_nodes_csv(const std::string& filename);
void process_edges_csv(const std::string &edgesFilename, std::unordered_map<std::string, int> &nodeMap, bool directed);
bool process_json(const std::string& filename);


using namespace emscripten;

val graph_nodes(void);
val graph_edges(void);
val graph_from_csv(const std::string& nodesFilename, const std::string& edgesFilename, bool directed);
val graph_from_json(const std::string& filename);
val graph_from_gml(const std::string& filename);
val graph_from_gexf(const std::string& filename);
val graph_from_n_nodes(igraph_integer_t n, igraph_real_t p, bool directed);

#endif
#ifndef GENERATOR_H
#define GENERATOR_H

#include "../graph.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <unordered_set>

inline void ltrim(std::string &s);
inline void rtrim(std::string &s);
std::string trim(std::string &s);
std::vector<std::string> split(const std::string &s, char delimiter);

typedef std::unordered_map<std::string, int> NodeMap;

using namespace emscripten;

val graph_nodes(igraph_t *g);
val graph_edges(igraph_t *g);

// Keep default ONLY in the header:
void create_node(igraph_t *g,
                 igraph_integer_t id,
                 const char *label,
                 const char *tableName,
                 emscripten::val attributes);

#endif

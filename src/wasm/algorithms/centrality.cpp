#include "../graph.h"
#include <iostream>
#include <string>

// For rendering on the frontend
#define MIN_SCALE 5
#define MAX_SCALE 30

double scaleCentrality(double centrality, double max_centrality) {
    double scaled = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * (centrality / max_centrality);
    return scaled;
}


val betweenness_centrality(void) {
    IGraphVector betweenness;
    igraph_betweenness(&globalGraph, betweenness.vec(), igraph_vss_all(), true, igraph_weights());

    double max_centrality = betweenness.max();
    val result = val::object();
    val sizeMap = val::object();
    val data = val::object();
    data.set("algorithm", "Betweenness Centrality");

    val centralities = val::array();
    for (igraph_integer_t v = 0; v < igraph_vcount(&globalGraph); ++v) {
        val c = val::object();
        double centrality = betweenness.at(v);
        double scaled_centrality = scaleCentrality(centrality, max_centrality);

        std::stringstream stream;
        stream << std::fixed << std::setprecision(2) << centrality;

        sizeMap.set(v, scaled_centrality);
        c.set("id", v);
        c.set("node", igraph_get_name(v));
        c.set("centrality", std::stod(stream.str()));
        centralities.set(v, c);
    }
    data.set("centralities", centralities);

    result.set("sizeMap", sizeMap);
    result.set("mode", MODE_SIZE_SCALAR);
    result.set("data", data);
    return result;
}

val closeness_centrality(void) {
    IGraphVector closeness;

    igraph_closeness(&globalGraph, closeness.vec(), NULL, NULL, igraph_vss_all(), IGRAPH_OUT, NULL, true);

    double max_centrality = closeness.max_nonan();
    val result = val::object();
    val sizeMap = val::object();
    val data = val::object();
    data.set("algorithm", "Closeness Centrality");

    val centralities = val::array();
    for (igraph_integer_t v = 0; v < igraph_vcount(&globalGraph); ++v) {
        val c = val::object();
        double centrality = closeness.at(v);
        double scaled_centrality = scaleCentrality(isnan(centrality) ? 0 : centrality, max_centrality);

        std::stringstream stream;
        stream << std::fixed << std::setprecision(4) << centrality;

        sizeMap.set(v, scaled_centrality);
        c.set("id", v);
        c.set("node", igraph_get_name(v));
        c.set("centrality", std::stod(stream.str()));
        centralities.set(v, c);
    }
    data.set("centralities", centralities);

    result.set("sizeMap", sizeMap);
    result.set("mode", MODE_SIZE_SCALAR);
    result.set("data", data);
    return result;
}

val degree_centrality(void) {
    IGraphVectorInt degrees;

    igraph_degree(&globalGraph, degrees.vec(), igraph_vss_all(), IGRAPH_OUT, IGRAPH_NO_LOOPS);

    double max_centrality = degrees.max();
    val result = val::object();
    val sizeMap = val::object();
    val data = val::object();
    data.set("algorithm", "Degree Centrality");

    val centralities = val::array();

    for (igraph_integer_t v = 0; v < degrees.size(); ++v) {
        val c = val::object();
        double centrality = degrees.at(v);
        double scaled_centrality = scaleCentrality(centrality, max_centrality);
        
        std::stringstream stream;
        stream << std::fixed << std::setprecision(2) << centrality;

        sizeMap.set(v, scaled_centrality);
        c.set("id", v);
        c.set("node", igraph_get_name(v));
        c.set("centrality", std::stod(stream.str()));
        centralities.set(v, c);
    }
    data.set("centralities", centralities);

    result.set("sizeMap", sizeMap);
    result.set("mode", MODE_SIZE_SCALAR);
    result.set("data", data);
    return result;
}

val eigenvector_centrality(void) {
    IGraphVector evs;
    igraph_real_t value;

    igraph_eigenvector_centrality(&globalGraph, evs.vec(), &value, IGRAPH_DIRECTED, false, igraph_weights(), NULL);

    double max_centrality = evs.max();
    val result = val::object();
    val sizeMap = val::object();
    val data = val::object();
    data.set("algorithm", "Eigenvector Centrality");


    std::stringstream stream;
    stream << std::fixed << std::setprecision(2) << value;
    data.set("eigenvalue", std::stod(stream.str()));

    val centralities = val::array();
    for (igraph_integer_t v = 0; v < evs.size(); ++v) {
        val c = val::object();
        double centrality = evs.at(v);
        double scaled_centrality = scaleCentrality(centrality, max_centrality);
        
        std::stringstream stream;
        stream << std::fixed << std::setprecision(4) << centrality;
        
        sizeMap.set(v, scaled_centrality);
        c.set("id", v);
        c.set("node", igraph_get_name(v));
        c.set("centrality", std::stod(stream.str()));
        centralities.set(v, c);
    }
    data.set("centralities", centralities);
    
    result.set("sizeMap", sizeMap);
    result.set("mode", MODE_SIZE_SCALAR);
    result.set("data", data);
    return result;
}

val harmonic_centrality(void) {
    IGraphVector scores;

    igraph_harmonic_centrality(&globalGraph, scores.vec(), igraph_vss_all(), IGRAPH_OUT, igraph_weights(), true);

    double max_centrality = scores.max();
    val result = val::object();
    val sizeMap = val::object();
    val data = val::object();
    data.set("algorithm", "Harmonic Centrality");


    val centralities = val::array();
    for (igraph_integer_t v = 0; v < igraph_vcount(&globalGraph); ++v) {
        val c = val::object();
        double centrality = scores.at(v);
        double scaled_centrality = scaleCentrality(isnan(centrality) ? 0 : centrality, max_centrality);

        std::stringstream stream;
        stream << std::fixed << std::setprecision(4) << centrality;
        
        sizeMap.set(v, scaled_centrality);
        c.set("id", v);
        c.set("node", igraph_get_name(v));
        c.set("centrality", std::stod(stream.str()));
        centralities.set(v, c);
    }
    data.set("centralities", centralities);

    result.set("sizeMap", sizeMap);
    result.set("mode", MODE_SIZE_SCALAR);
    result.set("data", data);
    return result;
}

val strength(void) {
    IGraphVector strengths;

    igraph_strength(&globalGraph, strengths.vec(), igraph_vss_all(), IGRAPH_OUT, IGRAPH_NO_LOOPS, igraph_weights());

    double max_centrality = strengths.max();
    val result = val::object();
    val sizeMap = val::object();
    val data = val::object();
    data.set("algorithm", "Strength Centrality");

    val centralities = val::array();
    for (igraph_integer_t v = 0; v < strengths.size(); ++v) {
        val c = val::object();
        double centrality = strengths.at(v);
        double scaled_centrality = scaleCentrality(centrality, max_centrality);
        
        std::stringstream stream;
        stream << std::fixed << std::setprecision(2) << centrality;
        
        sizeMap.set(v, scaled_centrality);
        c.set("id", v);
        c.set("node", igraph_get_name(v));
        c.set("centrality", std::stod(stream.str()));
        centralities.set(v, c);
    }
    data.set("centralities", centralities);

    result.set("sizeMap", sizeMap);
    result.set("mode", MODE_SIZE_SCALAR);
    result.set("data", data);
    return result;
} 

val pagerank(igraph_real_t damping) {
    igraph_real_t value;
    IGraphVector vec;

    std::stringstream stream;
    stream << std::fixed << std::setprecision(2) << damping;

    igraph_pagerank(&globalGraph, IGRAPH_PAGERANK_ALGO_PRPACK, vec.vec(), &value, igraph_vss_all(), IGRAPH_DIRECTED, damping, igraph_weights(), NULL);

    double max_centrality = vec.max();
    val result = val::object();
    val sizeMap = val::object();
    val data = val::object();
    data.set("algorithm", "PageRank");

    data.set("damping", stream.str());

    val centralities = val::array();
    for (igraph_integer_t v = 0; v < vec.size(); ++v) {
        val c = val::object();
        double centrality = vec.at(v);
        double scaled_centrality = scaleCentrality(centrality, max_centrality);
        
        std::stringstream stream;
        stream << std::fixed << std::setprecision(4) << centrality;

        sizeMap.set(v, scaled_centrality);
        c.set("id", v);
        c.set("node", igraph_get_name(v));
        c.set("centrality", std::stod(stream.str()));
        centralities.set(v, c);
    }
    data.set("centralities", centralities);

    result.set("sizeMap", sizeMap);
    result.set("mode", MODE_SIZE_SCALAR);
    result.set("data", data);
    return result;
}

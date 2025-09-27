#include "generator.h"
#include <cstring>
#include <string>

static inline bool eq(const char *a, const char *b)
{
    return a && b && std::strcmp(a, b) == 0;
}

static inline std::string to_str(double x)
{
    // Trim trailing zeros for nicer output (optional)
    std::string s = std::to_string(x);
    auto pos = s.find('.');
    if (pos != std::string::npos)
    {
        // erase trailing zeros
        while (!s.empty() && s.back() == '0')
            s.pop_back();
        if (!s.empty() && s.back() == '.')
            s.pop_back();
    }
    return s;
}

static inline bool is_empty_object(const emscripten::val &v)
{
    if (v.isUndefined() || v.isNull())
        return true;
    auto keys = emscripten::val::global("Object").call<emscripten::val>("keys", v);
    return keys["length"].as<unsigned>() == 0u;
}

void create_node(igraph_t *g,
                 igraph_integer_t id,
                 const char *label,
                 const char *tableName,
                 emscripten::val attributes)
{
    SETVAS(g, "label", id, label);
    SETVAS(g, "tableName", id, tableName);

    if (is_empty_object(attributes))
        return;

    auto keys = emscripten::val::global("Object").call<emscripten::val>("keys", attributes);
    unsigned len = keys["length"].as<unsigned>();
    for (unsigned i = 0; i < len; i++)
    {
        std::string key = keys[i].as<std::string>();
        std::string value = attributes[key].as<std::string>();
        SETVAS(g, key.c_str(), id, value.c_str());
    }
}

val vertex_attributes_object(const igraph_t *g, igraph_integer_t vid)
{
    igraph_strvector_t gnames, vnames, enames;
    igraph_vector_int_t gtypes, vtypes, etypes;

    igraph_strvector_init(&gnames, 0);
    igraph_strvector_init(&vnames, 0);
    igraph_strvector_init(&enames, 0);
    igraph_vector_int_init(&gtypes, 0);
    igraph_vector_int_init(&vtypes, 0);
    igraph_vector_int_init(&etypes, 0);

    val attrs = val::object();

    if (igraph_cattribute_list(g, &gnames, &gtypes, &vnames, &vtypes, &enames, &etypes) == IGRAPH_SUCCESS)
    {
        long nv = igraph_strvector_size(&vnames);
        for (long i = 0; i < nv; ++i)
        {
            // (STR macro is only deprecated -> warning is OK; you can migrate later)
            const char *aname = STR(vnames, i);
            if (eq(aname, "label") || eq(aname, "tableName") || eq(aname, "name"))
                continue;

            int atype = VECTOR(vtypes)[i]; // enum value
            switch (atype)
            {
            case IGRAPH_ATTRIBUTE_NUMERIC:
            {
                double v = VAN(g, aname, vid);
                attrs.set(aname, to_str(v));
                break;
            }
            case IGRAPH_ATTRIBUTE_BOOLEAN:
            {
                int b = (int)VAB(g, aname, vid);
                attrs.set(aname, b ? "true" : "false");
                break;
            }
            case IGRAPH_ATTRIBUTE_STRING:
            {
                const char *s = VAS(g, aname, vid);
                attrs.set(aname, s ? std::string(s) : std::string(""));
                break;
            }
            default:
                attrs.set(aname, std::string(""));
            }
        }
    }

    igraph_strvector_destroy(&gnames);
    igraph_strvector_destroy(&vnames);
    igraph_strvector_destroy(&enames);
    igraph_vector_int_destroy(&gtypes);
    igraph_vector_int_destroy(&vtypes);
    igraph_vector_int_destroy(&etypes);

    if (is_empty_object(attrs))
        return val::undefined();

    return attrs;
}

val edge_attributes_object(const igraph_t *g, igraph_integer_t eid)
{
    igraph_strvector_t gnames, vnames, enames;
    igraph_vector_int_t gtypes, vtypes, etypes;

    igraph_strvector_init(&gnames, 0);
    igraph_strvector_init(&vnames, 0);
    igraph_strvector_init(&enames, 0);
    igraph_vector_int_init(&gtypes, 0);
    igraph_vector_int_init(&vtypes, 0);
    igraph_vector_int_init(&etypes, 0);

    val attrs = val::object();

    if (igraph_cattribute_list(g, &gnames, &gtypes, &vnames, &vtypes, &enames, &etypes) == IGRAPH_SUCCESS)
    {
        long ne = igraph_strvector_size(&enames);
        for (long i = 0; i < ne; ++i)
        {
            const char *aname = STR(enames, i);
            if (eq(aname, "weight"))
                continue;

            int atype = VECTOR(etypes)[i];
            switch (atype)
            {
            case IGRAPH_ATTRIBUTE_NUMERIC:
            {
                double v = EAN(g, aname, eid);
                attrs.set(aname, to_str(v));
                break;
            }
            case IGRAPH_ATTRIBUTE_BOOLEAN:
            {
                int b = (int)EAB(g, aname, eid);
                attrs.set(aname, b ? "true" : "false");
                break;
            }
            case IGRAPH_ATTRIBUTE_STRING:
            {
                const char *s = EAS(g, aname, eid);
                attrs.set(aname, s ? std::string(s) : std::string(""));
                break;
            }
            default:
                attrs.set(aname, std::string(""));
            }
        }
    }

    igraph_strvector_destroy(&gnames);
    igraph_strvector_destroy(&vnames);
    igraph_strvector_destroy(&enames);
    igraph_vector_int_destroy(&gtypes);
    igraph_vector_int_destroy(&vtypes);
    igraph_vector_int_destroy(&etypes);

    if (is_empty_object(attrs))
        return val::undefined();

    return attrs;
}

val graph_nodes(igraph_t *g)
{
    val nodes = val::array();
    std::string attr = igraph_check_attribute(g);
    for (igraph_integer_t i = 0; i < igraph_vcount(g); i++)
    {
        val n = val::object();
        n.set("id", std::to_string(i));

        const char *label = VAS(g, "label", i);
        if (label)
            n.set("label", std::string(label));

        const char *table = VAS(g, "tableName", i);
        if (table)
            n.set("tableName", std::string(table));

        val attrs = vertex_attributes_object(g, i);
        if (!attrs.isUndefined())
            n.set("attributes", attrs);

        nodes.set(i, n);
    }
    return nodes;
}

val graph_edges(igraph_t *g)
{
    val edges = val::array();

    for (igraph_integer_t i = 0; i < igraph_ecount(g); i++)
    {
        igraph_integer_t from, to;
        igraph_edge(g, i, &from, &to);

        val e = val::object();
        e.set("source", std::to_string(from));
        e.set("target", std::to_string(to));

        if (igraph_cattribute_has_attr(g, IGRAPH_ATTRIBUTE_EDGE, "weight"))
        {
            double w = EAN(g, "weight", i);
            e.set("weight", w);
        }

        val attrs = edge_attributes_object(g, i);
        if (!attrs.isUndefined())
            e.set("attributes", attrs);

        edges.set(i, e);
    }
    return edges;
}

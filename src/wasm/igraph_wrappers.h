#ifndef IGRAPH_WRAPPERS_H
#define IGRAPH_WRAPPERS_H

// RAII wrapper for igraph variables
#include "igraph/include/igraph.h"

#define NEGINF -9999

// RAII wrapper for igraph_vector_t
class IGraphVector {
public:
    IGraphVector() {
        igraph_vector_init(&v, 0);
    }

    ~IGraphVector() {
        igraph_vector_destroy(&v);
    }

    void push_back(igraph_real_t value) {
        igraph_vector_push_back(&v, value);
    }

    size_t size() {
        return igraph_vector_size(&v);
    }

    igraph_real_t at(size_t index) {
        return VECTOR(v)[index];
    }

    igraph_real_t max() {
        return igraph_vector_max(&v);
    }

    igraph_real_t avg_ignore_zeros() {
        igraph_real_t sum = 0;
        igraph_integer_t count = 0;
        for (long int i = 0; i < igraph_vector_size(&v); ++i) {
            igraph_real_t value = VECTOR(v)[i];
            if (value != 0) {
                sum += value;
                count++;
            }
        }
        return count == 0 ? 0 : sum / count;
    }

    igraph_real_t max_nonan() {
        igraph_real_t max = NEGINF;
        for (long int i = 0; i < igraph_vector_size(&v); ++i) {
            igraph_real_t value = VECTOR(v)[i];
            if (!isnan(value) && value > max) {
                max = value;
            }
        }
        return max;
    }

    igraph_vector_t* vec() {
        return &v;
    }

private:
    igraph_vector_t v;
};

// RAII wrapper for igraph_vector_int_t
class IGraphVectorInt {
public:
    IGraphVectorInt() {
        igraph_vector_int_init(&v, 0);
    }

    ~IGraphVectorInt() {
        igraph_vector_int_destroy(&v);
    }

    void push_back(igraph_integer_t value) {
        igraph_vector_int_push_back(&v, value);
    }

    size_t size() {
        return igraph_vector_int_size(&v);
    }

    igraph_integer_t at(size_t index) {
        return VECTOR(v)[index];
    }

    igraph_integer_t max() {
        return igraph_vector_int_max(&v);
    }

    igraph_vector_int_t* vec() {
        return &v;
    }

private:
    igraph_vector_int_t v;
};

// RAII wrapper for igraph_vector_int_list_t
class IGraphVectorIntList {
public:
    IGraphVectorIntList() {
        igraph_vector_int_list_init(&v, 0);
    }

    ~IGraphVectorIntList() {
        igraph_vector_int_list_destroy(&v);
    }

    void push_back(IGraphVectorInt &value) {
        igraph_vector_int_list_push_back(&v, value.vec());
    }

    size_t size() {
        return igraph_vector_int_list_size(&v);
    }

    igraph_vector_int_t at(size_t index) {
        return VECTOR(v)[index];
    }

    igraph_vector_int_list_t* vec() {
        return &v;
    }

private:
    igraph_vector_int_list_t v;
};

// RAII wrapper for igraph_matrix_t
class IGraphMatrix {
public:
    IGraphMatrix() {
        igraph_matrix_init(&m, 0, 0);
    }

    ~IGraphMatrix() {
        igraph_matrix_destroy(&m);
    }

    igraph_matrix_t* mat() {
        return &m;
    }

    int nrows() {
        return igraph_matrix_nrow(&m);
    }

    int ncols() {
        return igraph_matrix_ncol(&m);
    }

    igraph_real_t get(int i, int j) {
        return MATRIX(m, i, j);
    }

private:
    igraph_matrix_t m;
};


#endif
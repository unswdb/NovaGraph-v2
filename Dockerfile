# -------- WASM Compilation Stage --------
FROM node:22-slim AS wasm-build

# Install system dependencies for building C++ and WASM
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    python3 \
    curl \
    bash \
    ca-certificates \
    flex \
    bison \
    && rm -rf /var/lib/apt/lists/*

# Install Emscripten
WORKDIR /opt
RUN git clone https://github.com/emscripten-core/emsdk.git emsdk && \
    cd emsdk && \
    ./emsdk install latest && \
    ./emsdk activate latest

ENV EMSDK=/opt/emsdk
ENV PATH="${EMSDK}:${EMSDK}/node/latest/bin:${EMSDK}/upstream/emscripten:${PATH}"

# Copy WASM source files
WORKDIR /src
COPY src/wasm/ ./wasm/

# Clone WASM dependencies
RUN cd wasm && \
    git clone https://github.com/zeux/pugixml.git && \
    git clone https://github.com/Tencent/rapidjson.git && \
    git clone https://github.com/igraph/igraph.git

# Build pugixml
RUN cd wasm/pugixml && \
    mkdir build && cd build && \
    emcmake cmake .. && \
    emmake make

# Patch WASM files
RUN cd wasm/igraph && \
    sed -i 's/message(FATAL_ERROR "IEEE754 double endianness test terminated abnormally.")/set(IEEE754_DOUBLE_BIG_ENDIAN FALSE)\nset(IEEE754_DOUBLE_LITTLE_ENDIAN TRUE)/' etc/cmake/ieee754_endianness.cmake && \
    sed -i 's/message(FATAL_ERROR "igraph only supports platforms where IEEE754 doubles have the same endianness as uint64_t.")/set(IEEE754_DOUBLE_BIG_ENDIAN FALSE)\nset(IEEE754_DOUBLE_LITTLE_ENDIAN TRUE)/' etc/cmake/ieee754_endianness.cmake && \
    sed -i '/include(etc\/cmake\/ieee754_endianness.cmake)/i set(IEEE754_DOUBLE_BIG_ENDIAN FALSE)\nset(IEEE754_DOUBLE_LITTLE_ENDIAN TRUE)' CMakeLists.txt

# Build igraph
RUN cd wasm/igraph && \
    mkdir build && cd build && \
    emcmake cmake .. && \
    emmake make

# Build graph.js
RUN em++ wasm/*.cpp wasm/algorithms/*.cpp wasm/generators/*.cpp -o graph.js \
    -s WASM=1 \
    -I./wasm -I./wasm/igraph/build/include -I./wasm/igraph/include \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s ENVIRONMENT='web' \
    -s EXPORT_NAME='createModule' \
    -s LINKABLE=1 \
    -s FORCE_FILESYSTEM=1 \
    -s WASMFS=1 \
    -s EXPORTED_RUNTIME_METHODS=['FS'] \
    -s ALLOW_MEMORY_GROWTH=1 \
    -lembind --no-entry \
    -O3 \
    ./wasm/igraph/build/src/libigraph.a \
    ./wasm/pugixml/build/libpugixml.a

# -------- Base Dependencies --------
FROM node:22-slim AS base-deps
WORKDIR /src
COPY package.json package-lock.json ./

# -------- Development Dependencies --------
FROM base-deps AS development-deps
RUN npm ci

# -------- Production Dependencies --------
FROM base-deps AS production-deps
RUN npm ci --omit=dev

# -------- Build for Production --------
FROM development-deps AS build
COPY . .
COPY --from=wasm-build /src/graph.js ./src/graph.js
RUN npm run build

# -------- Development --------
FROM development-deps AS development
ENV NODE_ENV=development
COPY . .
COPY --from=wasm-build /src/graph.js ./src/graph.js
EXPOSE 5173
CMD ["npm", "run", "dev"]

# -------- Production --------
FROM production-deps AS production
ENV NODE_ENV=production
COPY --from=build /src/build ./build
EXPOSE 3000
CMD ["npm", "run", "start"]
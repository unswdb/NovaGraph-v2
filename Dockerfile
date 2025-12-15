# -------- WASM Dependencies Build Stage --------
FROM node:22-slim AS wasm-deps

# Install system dependencies for building C++ and WASM
RUN apt-get update && apt-get install -y --no-install-recommends \
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
    cd emsdk && ./emsdk install latest && ./emsdk activate latest
ENV EMSDK=/opt/emsdk
ENV PATH="${EMSDK}:${EMSDK}/node/latest/bin:${EMSDK}/upstream/emscripten:${PATH}"

# Prepare source
WORKDIR /src/wasm
RUN git clone https://github.com/zeux/pugixml.git && \
    git clone https://github.com/Tencent/rapidjson.git && \
    git clone --branch 0.10.17 --depth 1 https://github.com/igraph/igraph.git

# Build pugixml
RUN cd pugixml && mkdir build && cd build && \
    emcmake cmake .. -DCMAKE_C_FLAGS="-Wno-error=uninitialized" && \
    emmake make

# Build igraph
RUN cd igraph && \
    sed -i 's/message(FATAL_ERROR "IEEE754 double endianness test terminated abnormally.")/set(IEEE754_DOUBLE_BIG_ENDIAN FALSE)\nset(IEEE754_DOUBLE_LITTLE_ENDIAN TRUE)/' etc/cmake/ieee754_endianness.cmake && \
    sed -i 's/message(FATAL_ERROR "igraph only supports platforms where IEEE754 doubles have the same endianness as uint64_t.")/set(IEEE754_DOUBLE_BIG_ENDIAN FALSE)\nset(IEEE754_DOUBLE_LITTLE_ENDIAN TRUE)/' etc/cmake/ieee754_endianness.cmake && \
    sed -i '/include(etc\/cmake\/ieee754_endianness.cmake)/i set(IEEE754_DOUBLE_BIG_ENDIAN FALSE)\nset(IEEE754_DOUBLE_LITTLE_ENDIAN TRUE)' CMakeLists.txt && \
    mkdir build && cd build && \
    emcmake cmake .. -DCMAKE_C_FLAGS="-Wno-error=uninitialized" && \
    emmake make


# -------- WASM Application Build Stage --------
FROM wasm-deps AS wasm-build
WORKDIR /src

# Copy only your own sources now (doesn't break deps cache)
COPY src/kuzu/ ./kuzu/
COPY src/igraph/ ./igraph/
COPY src/wasm/ ./wasm/

# Install typescript
RUN npm install -g typescript

# Link against cached libs
RUN em++ wasm/*.cpp wasm/algorithms/*.cpp wasm/generators/*.cpp -o graph.js \
    -s WASM=1 \
    -I./wasm -I./wasm/igraph/build/include -I./wasm/igraph/include -I./kuzu \
    -I./wasm/rapidjson/include \
    -s EXPORT_ES6=1 -s MODULARIZE=1 -s ENVIRONMENT='web' \
    -s EXPORT_NAME='createModule' -s LINKABLE=1 -s FORCE_FILESYSTEM=1 \
    -s WASMFS=1 -s EXPORTED_RUNTIME_METHODS=['FS'] -s ALLOW_MEMORY_GROWTH=1 \
    -lembind --no-entry -O3 \
    /src/wasm/igraph/build/src/libigraph.a \
    /src/wasm/pugixml/build/libpugixml.a \
    --emit-tsd graph.d.ts


# -------- Remaining Stages --------
FROM node:22-slim AS base-deps
WORKDIR /src
COPY package.json package-lock.json ./

FROM base-deps AS development-deps
RUN npm ci

FROM base-deps AS production-deps
RUN npm ci --omit=dev

FROM development-deps AS build
# Build arguments for Kuzu configuration (can be passed during docker build)
ARG KUZU_TYPE=persistent
ARG KUZU_MODE=async
ARG KUZU_DB_PATH=
# Set as environment variables for Vite build process
ENV VITE_KUZU_TYPE=${KUZU_TYPE}
ENV VITE_KUZU_MODE=${KUZU_MODE}
ENV VITE_KUZU_DB_PATH=${KUZU_DB_PATH}
COPY . .
COPY --from=wasm-build /src/graph.js ./src/graph.js
COPY --from=wasm-build /src/graph.wasm ./src/graph.wasm
COPY --from=wasm-build /src/graph.d.ts ./src/graph.d.ts
RUN npm run build

FROM development-deps AS development
ENV NODE_ENV=development
# Kuzu configuration environment variables (can be overridden at runtime):
# - KUZU_TYPE / VITE_KUZU_TYPE: "inmemory" or "persistent" (default: "persistent")
# - KUZU_MODE / VITE_KUZU_MODE: "sync" or "async" (default: "async")
# - KUZU_DB_PATH / VITE_KUZU_DB_PATH: optional database path for persistent mode
# Note: VITE_ prefixed variables are for client-side access in Vite
COPY . .
COPY --from=wasm-build /src/graph.js ./src/graph.js
COPY --from=wasm-build /src/graph.wasm ./src/graph.wasm
COPY --from=wasm-build /src/graph.d.ts ./src/graph.d.ts
EXPOSE 5174
CMD ["npm", "run", "dev"]

FROM production-deps AS production
ENV NODE_ENV=production
# Kuzu configuration environment variables (can be overridden at runtime):
# - KUZU_TYPE / VITE_KUZU_TYPE: "inmemory" or "persistent" (default: "persistent")
# - KUZU_MODE / VITE_KUZU_MODE: "sync" or "async" (default: "async")
# - KUZU_DB_PATH / VITE_KUZU_DB_PATH: optional database path for persistent mode
# Note: VITE_ prefixed variables are for client-side access in Vite
COPY --from=build /src/build ./build
EXPOSE 3000
CMD ["npm", "run", "start"]
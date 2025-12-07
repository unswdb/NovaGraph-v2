# Welcome to NovaGraph V2.0 ⭐!

A fast, WebAssembly-powered graph analysis and visualization tool built for the browser.

NovaGraph combines a WASM-compiled C++ graph engine (igraph + kuzu) with a React frontend stack, enabling near-native performance for graph exploration, querying, and algorithmic analysis directly in your browser. No specialized infrastructure or installation required.

The project is part of UNSW Honours Thesis and the description can be found at [TMS](https://thesis.cse.unsw.edu.au/topic/767).

## Features

- **Define or Import Your Graph Data**: Construct nodes and/or edges through a schema-driven interface, specifying properties and metadata, or import existing graph data from CSV or JSON files.
- **Visualize Your Graph**: Render and explore large graphs smoothly using a high-performance WebGL visualizer.
- **Run Algorithms and Execute Queries**: Select from a library of algorithms to analyze your graph, or write queries to test your hypotheses directly.
- **Export Results for Further Analysis**: Save your findings as JSON or YAML format for further analysis.

## Getting Started

### Interactive Docker Build (Recommended)

We provide an interactive build script that lets you select the Kuzu database mode and build/run with Docker:

```bash
# Run the interactive script
./docker-build.sh
```

The script will show you an interactive menu and wait for your input:

```
╔════════════════════════════════════════════════════════╗
║     NovaGraph - Kuzu Database Mode Selection          ║
╚════════════════════════════════════════════════════════╝

Please select the Kuzu database mode:

  1. inmemory sync    - In-memory database with synchronous operations
  2. inmemory async   - In-memory database with asynchronous operations
  3. persistent sync  - Persistent database with synchronous operations
  4. persistent async - Persistent database with asynchronous operations (default)

Enter your choice [1-4] (default: 4):
```

After selecting the mode, you'll be prompted to choose:

- **Service**: `novagraph-dev` (development) or `novagraph-prod` (production)
- **Action**: `run` (build and run), `build` (build only), or `rebuild` (rebuild without cache)

**Default mode**: `4. persistent async`

**Example usage:**

- Development: Select mode → `novagraph-dev` → `run` (will build, copy WASM files, and start)
- Production: Select mode → `novagraph-prod` → `run` (will build and start)

### Manual Docker Build

You can also build manually with Docker:

#### Development

```bash
# Build the image
docker build -t novagraph-dev --target development .

# Copy graph.js, graph.wasm and graph.d.ts. to local workspace
docker run --rm -v $(pwd):/host novagraph-dev cp ./src/graph.js ./src/graph.wasm ./src/graph.d.ts /host/src/

# Run with volume mounting
docker run -it --rm -v $(pwd):/src -w /src -p 5173:5173 -v /src/node_modules \
  -e NODE_ENV=development \
  -e KUZU_TYPE=persistent \
  -e VITE_KUZU_TYPE=persistent \
  -e KUZU_MODE=async \
  -e VITE_KUZU_MODE=async \
  novagraph-dev
```

To debug with the image:

```bash
docker run -it --entrypoint /bin/bash novagraph-dev
```

Your application will be available at `http://localhost:5173`.

> Note: Rebuild the Docker image whenever you update package.json, package-lock.json, or the WASM source code (`wasm/`).

#### Production

```bash
# Build with default configuration (persistent async)
docker build -t novagraph-prod --target=production .

# Or build with custom Kuzu configuration
docker build -t novagraph-prod --target=production \
  --build-arg KUZU_TYPE=persistent \
  --build-arg KUZU_MODE=async \
  --build-arg KUZU_DB_PATH=/data/db .

# Run the container
docker run -it -p 3000:3000 novagraph-prod
```

### Kuzu Configuration

You can configure the Kuzu database mode at deployment time:

- **KUZU_TYPE**: Database type
  - `inmemory`: Data stored in memory, lost on restart
  - `persistent` (default): Data persisted to IndexedDB in the browser
- **KUZU_MODE**: Execution mode
  - `sync`: Synchronous operations
  - `async` (default): Asynchronous operations using Web Workers

- **KUZU_DB_PATH**: Optional database path for persistent mode

**Note**: For production builds, the configuration is baked into the build at build time. For development, the configuration is read at runtime.

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

---

Built with ❤️ by unswdb.

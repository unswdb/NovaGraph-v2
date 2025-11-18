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

### Development

Start the development server with Docker:

```bash
# Build the image
docker build -t novagraph-dev --target development .

# Copy graph.js, graph.wasm and graph.d.ts. to local workspace
docker run --rm -v $(pwd):/host novagraph-dev cp ./src/graph.js ./src/graph.wasm ./src/graph.d.ts /host/src/

# Run with volume mounting
docker run -it --rm -v $(pwd):/src -w /src -p 5173:5173 -v /src/node_modules -e NODE_ENV=development novagraph-dev
```

To debug with the image:

```bash
docker run -it --entrypoint /bin/bash novagraph-dev
```

Your application will be available at `http://localhost:5173`.

> Note: Rebuild the Docker image whenever you update package.json, package-lock.json, or the WASM source code (`wasm/`).

## Production

Build and run using Docker:

```bash
docker build -t novagraph-prod --target=production .

# Run the container
docker run -it -p 3000:3000 novagraph-prod
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

---

Built with ❤️ by unswdb.

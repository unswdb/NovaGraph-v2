# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Development

Start the development server with Docker:

```bash
# Build the image
docker build -t novagraph-dev --target development .

# Copy graph.js, graph.wasm and graph.d.ts. to local workspace
docker run --rm -v $(pwd):/host novagraph-dev cp ./src/graph.js ./src/graph.wasm ./src/graph.d.ts /host/src/

# Copy KuzuController.d.ts file to local workspace
docker run --rm -v $(pwd):/host novagraph-dev cp ./src/kuzu/controllers/KuzuController.d.ts /host/src/kuzu/controllers/

# Run with volume mounting
docker run -it --rm -v $(pwd):/src -w /src -p 5173:5173 -v /src/node_modules -e NODE_ENV=development novagraph-dev
```

To debug with the image:

```bash
docker run -it --entrypoint /bin/bash novagraph-dev
```

Your application will be available at `http://localhost:5173`.

Note: You need to build the image again if you install any new dependencies or made changes to the WASM code.

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

Built with ❤️ using React Router.

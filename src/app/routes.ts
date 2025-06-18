import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("/novagraph", "routes/visualizer.tsx"),
  // route("/user", "routes/user.tsx"), // Basic route
  // route("/user/:id", "routes/user.$id.tsx"), // Dynamic route
] satisfies RouteConfig;

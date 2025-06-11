import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/counter", "routes/counter.tsx"),
  // route("/user", "routes/user.tsx"), // Basic route
  // route("/user/:id", "routes/user.$id.tsx"), // Dynamic route
] satisfies RouteConfig;

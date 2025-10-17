import { data } from "react-router";
import type { Route } from "./+types/$";

export async function loader(_: Route.LoaderArgs) {
  return data("Not Found", { status: 404 });
}

export default function CatchAll() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="xlarge-title font-bold">404</h1>
        <p className="text-typography-secondary">Page not found</p>
      </div>
    </div>
  );
}

import { data } from "react-router";
import type { Route } from "./+types/$";

// Catch-all route for unmatched paths
// This handles Chrome DevTools requests and other 404s gracefully
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  
  // Silently return 404 for Chrome DevTools and well-known paths
  if (
    url.pathname.startsWith("/.well-known/") ||
    url.pathname.includes("chrome.devtools")
  ) {
    return data(null, { status: 404 });
  }
  
  // For other paths, throw a proper 404
  throw data("Not Found", { status: 404 });
}

export default function CatchAll() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}


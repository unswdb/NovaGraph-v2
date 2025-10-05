import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./globals.css";
import { ThemeProvider } from "~/hooks/use-theme";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Toaster } from "~/components/ui/sonner";
import { LoadingProvider } from "~/components/ui/loading/loading-context";
import { Loading } from "~/components/ui/loading";
import { toast } from "sonner";
import { useEffect } from "react";
import isNoise from "./errors";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      const msg = String(event?.error?.message ?? event?.message ?? "");
      if (isNoise(msg)) return; // ignore harmless Cosmograph/WebGL/Resize noise

      console.error(msg);
      toast.error("An unexpected error occurred.");
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const msg =
        typeof event.reason === "string"
          ? event.reason
          : String(event.reason?.message ?? "");
      if (isNoise(msg)) return;

      console.error(msg);
      toast.error("Something went wrong. Please try again later.");
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <LoadingProvider>
              {children}
              <Loading />
            </LoadingProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

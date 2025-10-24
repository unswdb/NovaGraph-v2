import { data, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

import type { Route } from "./+types/$";

import { Button } from "~/components/ui/button";

export async function loader(_: Route.LoaderArgs) {
  return data("Not Found", { status: 404 });
}

export default function CatchAll() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <div className="w-4/5 min-h-[80vh] relative flex flex-col justify-center">
        <p className="absolute top-0 left-0 small-body text-typography-secondary">
          404
        </p>
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl">Page not found</h1>
            <p className="text-typography-tertiary">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft />
            Go To Home
          </Button>
        </div>
      </div>
    </div>
  );
}

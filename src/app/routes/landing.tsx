import type { Route } from "./+types/landing";
import LandingPage from "@features/landing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NovaGraph" },
    { name: "description", content: "Visualize, Analyze, Discover" },
  ];
}

export default function Home() {
  return <LandingPage />;
}

import type { Route } from "./+types/visualizer";
import VisualizerPage from "@features/visualizer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NovaGraph" },
    { name: "description", content: "Visualize, Analyze, Discover" },
  ];
}

export default function Visualizer() {
  return <VisualizerPage />;
}

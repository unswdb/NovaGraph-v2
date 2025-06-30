// Infered from src/wasm/generators/generator.cpp
export type GraphNode = {
  id: number;
  name?: string;
};

export type GraphEdge = {
  source: number;
  target: number;
};

export { type MainModule as GraphModule } from "~/graph";
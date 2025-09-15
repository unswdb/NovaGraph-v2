// Infered from src/wasm/algorithms
export type CentralityItem = {
  id: number;
  node: string;
  centrality: number;
};

export type CentralityOutputData = {
  centralities: CentralityItem[];
};

export type CentralityItem<T = string> = {
  node: T;
  centrality: number;
};

export const _parseCentralities = (
  centralities: CentralityItem<number>[],
  mapLabelBack: (id: string | number) => string
) => {
  return centralities.map((centrality) => ({
    node: mapLabelBack(centrality.node),
    centrality: centrality.centrality,
  }));
};

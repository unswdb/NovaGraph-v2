type BFSOutputData = {
    source: string;
    nodesFound: number;
    layers: { layer: string[]; index: number }[];
  };

type BFSGraphResult = {
  colorMap?: Record<string, number>;
  mode?: number;
  data: BFSOutputData;
};

export function IgraphBFSTranslator(
    IgraphToKuzu: Map<number, string>,
    algorithmResult: BFSOutputData | BFSGraphResult
) {
    const mapIdBack = (id: string | number): string => {
        const num = typeof id === "string" ? parseInt(id, 10) : id;
        const mapped = IgraphToKuzu.get(num);
        if (mapped === undefined) {
            console.warn(`[IgraphTranslator] Missing reverse mapping for id ${id}`);
            return String(id);
        }
        return mapped;
    };

    const hasWrapper =
        (algorithmResult as any)?.data &&
        typeof (algorithmResult as any).data === "object";

    const rawData: any = hasWrapper
        ? (algorithmResult as any).data
        : (algorithmResult as any);

    const mappedData: BFSOutputData = {
        ...rawData,
        source: mapIdBack(rawData.source),
        layers: Array.isArray(rawData.layers)
            ? rawData.layers.map((l: any) => ({
                layer: Array.isArray(l?.layer) ? l.layer.map((x: any) => mapIdBack(x)) : [],
                index: l?.index, // keep index as-is
                }))
            : [],
    };

    if (hasWrapper) {
        const colorMapIn = (algorithmResult as any).colorMap as
            | Record<string, number>
            | undefined;

        let colorMapOut: Record<string, number> | undefined;
        if (colorMapIn && typeof colorMapIn === "object") {
            colorMapOut = {};
            for (const [k, v] of Object.entries(colorMapIn)) {
                colorMapOut[mapIdBack(k)] = v as number;
            }
        }

        return {
            mode: (algorithmResult as any).mode,
            colorMap: colorMapOut,
            data: mappedData,
        } as BFSGraphResult;
    }

    return mappedData;
}
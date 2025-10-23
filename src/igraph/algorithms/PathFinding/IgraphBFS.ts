import type { IgraphInput } from "../../types/types";

// Consistent return type that matches GraphAlgorithmResult structure
export type BFSResult = {
    colorMap: Record<string, number>;
    mode: number;
    data: BFSOutputData;
};

export type BFSOutputData = {
    source: string;
    nodesFound: number;
    layers: { layer: string[]; index: number }[];
};

async function _runIgraphAlgo(
    igraphMod: any,
    KuzuToIgraphParsingResult: IgraphInput
) {
    return await igraphMod.create_graph_from_kuzu_to_igraph(
        KuzuToIgraphParsingResult.nodes,
        KuzuToIgraphParsingResult.src,
        KuzuToIgraphParsingResult.dst,
        KuzuToIgraphParsingResult.directed,
        KuzuToIgraphParsingResult.weight
    );
}

function _parseResult(
    IgraphToKuzu: Map<number, string>,
    algorithmResult: any
): BFSResult {
    const mapIdBack = (id: string | number): string => {
        const num = typeof id === "string" ? parseInt(id, 10) : id;
        const mapped = IgraphToKuzu.get(num);
        if (mapped === undefined) {
            console.warn(`[IgraphTranslator] Missing reverse mapping for id ${id}`);
            return String(id);
        }
        return mapped;
    };

    // Check if result has wrapper structure
    const hasWrapper = algorithmResult?.data && typeof algorithmResult.data === "object";
    const rawData = hasWrapper ? algorithmResult.data : algorithmResult;

    // Map the data back to Kuzu IDs
    const mappedData: BFSOutputData = {
        ...rawData,
        source: mapIdBack(rawData.source),
        layers: Array.isArray(rawData.layers)
            ? rawData.layers.map((l: any) => ({
                layer: Array.isArray(l?.layer) ? l.layer.map((x: any) => mapIdBack(x)) : [],
                index: l?.index ?? 0,
            }))
            : [],
    };

    // Handle colorMap if present
    let colorMapOut: Record<string, number> = {};
    if (hasWrapper && algorithmResult.colorMap) {
        for (const [k, v] of Object.entries(algorithmResult.colorMap)) {
            colorMapOut[mapIdBack(k)] = v as number;
        }
    }

    // Always return consistent structure
    return {
        mode: hasWrapper ? (algorithmResult.mode ?? 0) : 0,
        colorMap: colorMapOut,
        data: mappedData,
    };
}

export async function igraphBFS(
    igraphMod: any,
    KuzuToIgraphParsingResult: IgraphInput,
    IgraphToKuzu: Map<number, string>,
): Promise<BFSResult> {
    const wasmResult = await _runIgraphAlgo(igraphMod, KuzuToIgraphParsingResult);
    return _parseResult(IgraphToKuzu, wasmResult);
}
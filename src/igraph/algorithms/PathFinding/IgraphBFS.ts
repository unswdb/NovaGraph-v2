import type { KuzuToIgraphParseResult } from "../../types/types";

// Consistent return type that matches GraphAlgorithmResult structure
export type BFSData = {
    algorithm: string
    source: string;
    nodesFound: number;
    layers: { layer: string[]; index: number }[];
};

export type BFSResult = {
    colorMap: Record<string, number>;
    mode: number;
    data: BFSData;
};

async function _runIgraphAlgo(
    igraphMod: any,
    igraphSourceID: number
) {
    return await igraphMod.bfs(igraphSourceID); 
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
    const mappedData: BFSData = {
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
    graphData: KuzuToIgraphParseResult,
    kuzuSourceID: string
): Promise<BFSResult> {
    let igraphID: number | undefined = graphData.KuzuToIgraphMap.get(kuzuSourceID); 

if (igraphID === undefined) {
    console.warn("choosen source is either isolated or error in parsing")
    return {
        mode: 3,
        colorMap: {
            [kuzuSourceID]: 1
        },
        data: {
            algorithm: "Breadth-First Search",
            source: kuzuSourceID,
            nodesFound: 1,
            layers: [
                {
                    layer: [kuzuSourceID], 
                    index: 0
                }
            ]
        }
    }
    }
    const wasmResult = await _runIgraphAlgo(igraphMod, igraphID);
    return _parseResult(graphData.IgraphToKuzuMap, wasmResult);
}
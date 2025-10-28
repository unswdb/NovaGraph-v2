/**
 * Creates a function that maps Igraph IDs back to Kuzu IDs.
 *
 * @param IgraphToKuzu - Map from Igraph IDs to Kuzu IDs
 * @param enableWarning - Whether to log a warning when a mapping is missing (default: true)
 * @returns A function that maps an Igraph ID to a Kuzu ID
 */
export function createMapIdBack(
  IgraphToKuzu: Map<number, string>,
  enableWarning: boolean = true
): (id: string | number) => string {
  return (id: string | number): string => {
    const num = typeof id === "string" ? parseInt(id, 10) : id;
    const mapped = IgraphToKuzu.get(num);
    if (mapped === undefined) {
      if (enableWarning) {
        console.warn(`[IgraphTranslator] Missing reverse mapping for id ${id}`);
      }
      return String(id);
    }
    return mapped;
  };
}

/**
 * Maps colorMap keys from Igraph IDs back to Kuzu IDs.
 * Handles both node IDs (simple keys) and edge IDs (keys with "-" separator).
 *
 * @param colorMap - The colorMap with Igraph IDs as keys
 * @param mapIdBack - Function to map an Igraph ID back to a Kuzu ID
 * @returns A new colorMap with Kuzu IDs as keys
 */
export function mapColorMapIds(
  colorMap: Record<string, number>,
  mapIdBack: (id: string | number) => string
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(colorMap).map(([k, v]) =>
      k.includes("-")
        ? (() => {
            const [fromId, toId] = k.split("-");
            return [`${mapIdBack(fromId)}-${mapIdBack(toId)}`, v as number];
          })()
        : [mapIdBack(k), v as number]
    )
  ) as Record<string, number>;
}

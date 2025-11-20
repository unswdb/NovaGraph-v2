export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Handle BigInt serialization for query results
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifySafe(v: any): any {
  if (typeof v === "bigint") return v.toString();
  if (Array.isArray(v)) return v.map(stringifySafe);
  if (v && typeof v === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: Record<string, any> = {};
    for (const key in v) obj[key] = stringifySafe(v[key]);
    return obj;
  }
  return v;
}

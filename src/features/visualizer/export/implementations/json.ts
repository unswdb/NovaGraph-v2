import { FileCode2 } from "lucide-react";

import { downloadFile } from "../utils";

import type { ExportOption } from "./types";

export const ExportJSON: ExportOption = {
  label: "Export to JSON",
  value: "export-to-json",
  icon: FileCode2,
  mimeType: "application/json",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export: (data: Record<string, any>) => {
    // Handle BigInt serialization for query results
    const json = JSON.stringify(
      data,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    );
    downloadFile(json, "data.json", "application/json");
  },
};

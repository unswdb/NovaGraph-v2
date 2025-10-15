import { FileCode2 } from "lucide-react";

import { downloadFile } from "../utils";

import type { ExportOption } from "./types";

export const ExportJSON: ExportOption = {
  label: "Export to JSON",
  value: "export-to-json",
  icon: FileCode2,
  mimeType: "application/json",
  export: (data: Record<string, any>) => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, "data.json", "application/json");
  },
};

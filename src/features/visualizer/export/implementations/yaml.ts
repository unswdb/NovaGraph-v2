import YAML from "yaml";
import { FileCode2 } from "lucide-react";

import { downloadFile, stringifySafe } from "../utils";

import type { ExportOption } from "./types";

export const ExportYAML: ExportOption = {
  label: "Export to YAML",
  value: "export-to-yaml",
  icon: FileCode2,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export: (data: Record<string, any>) => {
    const yaml = YAML.stringify(stringifySafe(data), { indent: 2 });
    downloadFile(yaml, "data.yaml", "text/yaml");
  },
};

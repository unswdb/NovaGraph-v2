import * as ExportJSON from "./json";
import * as ExportYAML from "./yaml";
import type { ExportOption } from "./types";

// Export all export options
const ALL_EXPORTS: ExportOption[] = [
  ...Object.values(ExportJSON),
  ...Object.values(ExportYAML),
];
export default ALL_EXPORTS;

export { type ExportOption } from "./types";

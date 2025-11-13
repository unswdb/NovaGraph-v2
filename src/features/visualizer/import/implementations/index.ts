import * as ImportAuto from "./auto";
import * as ImportCSV from "./csv";
import * as ImportJSON from "./json";
import type { ImportOption } from "./types";

// Export all import options
const ALL_IMPORTS: ImportOption[] = [
  ...Object.values(ImportCSV),
  ...Object.values(ImportJSON),
  ...Object.values(ImportAuto),
];
export default ALL_IMPORTS;

export { type ImportOption } from "./types";

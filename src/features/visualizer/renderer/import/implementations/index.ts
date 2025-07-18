import * as Auto from "./manual-generate-graph";
import * as CSV from "./csv";
import type { ImportOption } from "./types";

// Export all algorithms
const ALL_IMPORTS: ImportOption[] = [
  ...Object.values(CSV),
  ...Object.values(Auto),
];
export default ALL_IMPORTS;

export { type ImportOption } from "./types";

import * as CSV from "./csv";
import type { ImportOption } from "./types";

// Export all algorithms
const ALL_IMPORTS: ImportOption[] = [...Object.values(CSV)];
export default ALL_IMPORTS;

export { type ImportOption, type ImportInput } from "./types";

import type { BaseInputType } from "../../types";
import type { AlgorithmSelectInput } from "./types";

export function createAlgorithmSelectInput(
  input: Partial<AlgorithmSelectInput> & BaseInputType<string>
): AlgorithmSelectInput {
  return {
    type: "algorithm-select",
    source: input.source || "static",
    multiple: false,
    options: [],
    required: true,
    ...input,
  };
}

export type { AlgorithmSelectInput } from "./types";
export { default as SelectInputComponent } from "./select-input";

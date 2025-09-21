import type { BaseInputType } from "../types";
import type { NumberInput } from "./types";

export function createNumberInput(
  input: Partial<NumberInput> & BaseInputType<number>
): NumberInput {
  return {
    type: "number",
    placeholder: "",
    defaultValue: 0,
    min: undefined,
    max: undefined,
    step: undefined,
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { NumberInput } from "./types";
export { default as NumberInputComponent } from "./number-input";

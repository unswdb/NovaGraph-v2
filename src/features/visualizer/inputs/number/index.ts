import type { NumberInput, PropsForNumber } from "./types";

export function createNumberInput(
  input: PropsForNumber<NumberInput>
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

export type { NumberInput, ValueForNumber, PropsForNumber } from "./types";
export { default as NumberInputComponent } from "./number-input";

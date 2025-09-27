import type {
  AlgorithmMultipleSelectInput,
  AlgorithmSelectInput,
  AlgorithmSingleSelectInput,
} from "./types";

type selectInputDefault = Pick<
  AlgorithmSelectInput,
  "required" | "showLabel" | "disabled"
>;

type SingleSelectInput = Omit<
  AlgorithmSingleSelectInput,
  "type" | "multiple" | keyof selectInputDefault
> &
  Partial<selectInputDefault> & { multiple?: false };

type MultipleSelectInput = Omit<
  AlgorithmMultipleSelectInput,
  "type" | "multiple" | keyof selectInputDefault
> &
  Partial<selectInputDefault> & { multiple: true };

// Overloads
export function createAlgorithmSelectInput(
  input: SingleSelectInput
): AlgorithmSingleSelectInput;
export function createAlgorithmSelectInput(
  input: MultipleSelectInput
): AlgorithmMultipleSelectInput;

export function createAlgorithmSelectInput(
  input: SingleSelectInput | MultipleSelectInput
): AlgorithmSelectInput {
  return {
    type: "algorithm-select",
    multiple: false,
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  } as any;
}

export type { AlgorithmSelectInput } from "./types";
export { default as SelectInputComponent } from "./select-input";

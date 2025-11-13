import type {
  AlgorithmMultipleSelectInput,
  AlgorithmSelectInput,
  AlgorithmSingleSelectInput,
  PropsForAlgorithmSelect,
  PropsForMultipleSelect,
  PropsForSingleSelect,
} from "./types";

// Overloads
export function createAlgorithmSelectInput(
  input: PropsForSingleSelect
): AlgorithmSingleSelectInput;

export function createAlgorithmSelectInput(
  input: PropsForMultipleSelect
): AlgorithmMultipleSelectInput;

export function createAlgorithmSelectInput(
  input: PropsForAlgorithmSelect<AlgorithmSelectInput>
): AlgorithmSelectInput {
  return {
    type: "algorithm-select",
    multiple: false,
    validate: true,
    required: true,
    showLabel: true,
    disabled: false,
    nullable: false,
    ...input,
  };
}

export type {
  AlgorithmSelectInput,
  ValueForAlgorithmSelect,
  PropsForAlgorithmSelect,
} from "./types";
export { default as SelectInputComponent } from "./select-input";

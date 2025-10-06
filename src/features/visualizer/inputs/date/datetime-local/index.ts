import type { DatetimeLocalInput, PropsForDatetimeLocal } from "./types";

export function createDatetimeLocalInput(
  input: PropsForDatetimeLocal<DatetimeLocalInput>
): DatetimeLocalInput {
  return {
    type: "datetime-local",
    min: undefined,
    max: undefined,
    step: undefined,
    validate: true,
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type {
  DatetimeLocalInput,
  ValueForDatetimeLocal,
  PropsForDatetimeLocal,
} from "./types";
export { default as DatetimeLocalInputComponent } from "./datetime-local-input";

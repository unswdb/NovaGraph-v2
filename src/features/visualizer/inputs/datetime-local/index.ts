import type { BaseInputType } from "../types";
import type { DatetimeLocalInput, DatetimeLocalValues } from "./types";

export function createDatetimeLocalInput(
  input: Partial<DatetimeLocalInput> & BaseInputType<DatetimeLocalValues>
): DatetimeLocalInput {
  return {
    type: "datetime-local",
    placeholder: "",
    min: undefined,
    max: undefined,
    step: undefined,
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { DatetimeLocalInput } from "./types";
export { default as DatetimeLocalInputComponent } from "./datetime-local-input";

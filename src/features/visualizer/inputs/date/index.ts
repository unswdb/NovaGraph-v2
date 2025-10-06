import type { DateInput, PropsForDate } from "./types";

export function createDateInput(input: PropsForDate<DateInput>): DateInput {
  return {
    type: "date",
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

export type { DateInput, ValueForDate, PropsForDate } from "./types";
export { default as DateInputComponent } from "./date-input";

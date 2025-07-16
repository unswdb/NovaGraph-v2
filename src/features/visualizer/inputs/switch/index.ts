import type { BaseInputType } from "../types";
import type { SwitchInput } from "./types";

export function createSwitchInput(
  input: Partial<SwitchInput> & BaseInputType<boolean>
): SwitchInput {
  return {
    type: "switch",
    required: false,
    defaultValue: false,
    ...input,
  };
}

export type { SwitchInput } from "./types";
export { default as SwitchInputComponent } from "./switch-input";

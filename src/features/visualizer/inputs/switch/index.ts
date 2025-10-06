import type { PropsForSwitch, SwitchInput } from "./types";

export function createSwitchInput(
  input: PropsForSwitch<SwitchInput>
): SwitchInput {
  return {
    type: "switch",
    defaultValue: false,
    validate: true,
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { SwitchInput, ValueForSwitch, PropsForSwitch } from "./types";
export { default as SwitchInputComponent } from "./switch-input";

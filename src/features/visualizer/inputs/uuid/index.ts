import type { PropsForUUID, UUIDInput } from "./types";

export function createUUIDInput(input: PropsForUUID<UUIDInput>): UUIDInput {
  return {
    type: "uuid",
    placeholder: "",
    validate: true,
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { UUIDInput, ValueForUUID, PropsForUUID } from "./types";
export { default as UUIDInputComponent } from "./uuid-input";

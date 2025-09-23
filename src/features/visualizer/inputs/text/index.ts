import type { BaseInputType } from "../types";
import type { TextInput, TextValues } from "./types";

export function createTextInput(
  input: Partial<TextInput> & BaseInputType<TextValues>
): TextInput {
  return {
    type: "text",
    placeholder: "",
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { TextInput } from "./types";
export { default as TextInputComponent } from "./text-input";

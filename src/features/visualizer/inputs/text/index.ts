import type { BaseInputType } from "../types";
import type { TextInput } from "./types";

export function createTextInput(
  input: Partial<TextInput> & BaseInputType<string>
): TextInput {
  return {
    type: "text",
    required: false,
    placeholder: "",
    defaultValue: "",
    ...input,
  };
}

export type { TextInput } from "./types";
export { default as TextInputComponent } from "./text-input";

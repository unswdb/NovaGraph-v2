import type { PropsForText, TextInput } from "./types";

export function createTextInput(input: PropsForText<TextInput>): TextInput {
  return {
    type: "text",
    placeholder: "",
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { TextInput, ValueForText, PropsForText } from "./types";
export { default as TextInputComponent } from "./text-input";

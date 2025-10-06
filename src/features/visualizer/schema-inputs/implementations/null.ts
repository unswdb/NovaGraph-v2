import { createTextInput, type TextInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const NullSchemaInput = defineSchemaInput<TextInput>({
  type: "NULL",
  displayName: "NULL",
  contexts: ["non-primary"],
  build: (args) => {
    return createTextInput({
      ...args,
      defaultValue: undefined,
      placeholder: "NULL",
      disabled: true,
      validate: false,
    });
  },
});

import { createTextInput, type TextInput } from "../inputs";
import { defineSchemaInput } from "./types";

export const StringSchemaInput = defineSchemaInput<TextInput>({
  type: "STRING",
  displayName: "STRING",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createTextInput({
      ...args,
    });
  },
});

import {
  createTextInput,
  type PropsForInput,
  type TextInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const StringSchemaInput = defineSchemaInput({
  type: "STRING" as const,
  displayName: "STRING",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<TextInput>) => {
    return createTextInput({
      ...args,
    });
  },
});

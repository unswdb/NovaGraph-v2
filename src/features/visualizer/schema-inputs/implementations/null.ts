import {
  createTextInput,
  type PropsForInput,
  type TextInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const NullSchemaInput = defineSchemaInput({
  type: "NULL" as const,
  displayName: "NULL",
  contexts: ["non-primary"],
  build: (args: PropsForInput<TextInput>) => {
    return createTextInput({
      ...args,
      defaultValue: undefined,
      placeholder: "NULL",
      disabled: true,
      validate: false,
    });
  },
});

import {
  createTextInput,
  type PropsForInput,
  type TextInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const StringSchemaInput = defineSchemaInput({
  type: "STRING" as const,
  displayName: "STRING",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<TextInput>, context: FieldContextKind) => {
    return createTextInput({
      ...args,
      nullable: context === "non-primary",
    });
  },
});

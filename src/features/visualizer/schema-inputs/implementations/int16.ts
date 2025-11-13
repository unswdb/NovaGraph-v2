import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const Int16SchemaInput = defineSchemaInput({
  type: "INT16" as const,
  displayName: "INT16",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<NumberInput>, context: FieldContextKind) => {
    return createNumberInput({
      ...args,
      nullable: context === "non-primary",
      min: -32768,
      max: 32767,
      step: 1,
      validator: (n) => {
        if (!Number.isInteger(n)) {
          return { success: false, message: "Must be an integer" };
        }
        if (!!args.validator) {
          return args.validator(n);
        }
        return { success: true };
      },
    });
  },
});

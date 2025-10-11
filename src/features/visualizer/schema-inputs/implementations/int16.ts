import { createNumberInput, type NumberInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const Int16SchemaInput = defineSchemaInput<NumberInput>({
  type: "INT16",
  displayName: "INT16",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createNumberInput({
      ...args,
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
        return { success: true }
      }
    });
  },
});

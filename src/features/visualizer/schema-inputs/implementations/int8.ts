import { createNumberInput, type NumberInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const Int8SchemaInput = defineSchemaInput<NumberInput>({
  type: "INT8",
  displayName: "INT8",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createNumberInput({
      ...args,
      min: -128,
      max: 127,
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

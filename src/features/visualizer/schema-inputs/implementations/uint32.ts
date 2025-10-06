import { createNumberInput, type NumberInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const Uint32SchemaInput = defineSchemaInput<NumberInput>({
  type: "UINT32",
  displayName: "UINT32",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createNumberInput({
      ...args,
      min: 0,
      max: 4294967295,
      step: 1,
      validator: (n) => {
        if (!Number.isInteger(n)) {
          return { success: false, message: "Must be an integer" };
        }
        return { success: true };
      },
    });
  },
});

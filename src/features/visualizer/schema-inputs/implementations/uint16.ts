import { createNumberInput, type NumberInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const Uint16SchemaInput = defineSchemaInput<NumberInput>({
  type: "UINT16",
  displayName: "UINT16",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createNumberInput({
      ...args,
      min: 0,
      max: 65535,
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

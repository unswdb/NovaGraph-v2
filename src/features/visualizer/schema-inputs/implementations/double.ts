import { createNumberInput, type NumberInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const DoubleSchemaInput = defineSchemaInput<NumberInput>({
  type: "DOUBLE",
  displayName: "DOUBLE",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createNumberInput({
      ...args,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      validator: (n) => {
        if (!Number.isFinite(n)) {
          return { success: false, message: "Must be a finite number" };
        }
        return { success: true };
      },
    });
  },
});

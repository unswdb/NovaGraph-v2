import { createNumberInput, type NumberInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const FloatSchemaInput = defineSchemaInput<NumberInput>({
  type: "FLOAT",
  displayName: "FLOAT",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createNumberInput({
      ...args,
      min: -3.4028235e38,
      max: 3.4028235e38,
      validator: (n) => {
        if (!Number.isFinite(n)) {
          return { success: false, message: "Must be a finite number" };
        }
        if (!!args.validator) {
          return args.validator(n);
        }
        return { success: true };
      },
    });
  },
});

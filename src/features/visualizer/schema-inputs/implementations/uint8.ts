import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const Uint8SchemaInput = defineSchemaInput({
  type: "UINT8" as const,
  displayName: "UINT8",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<NumberInput>) => {
    return createNumberInput({
      ...args,
      min: 0,
      max: 255,
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

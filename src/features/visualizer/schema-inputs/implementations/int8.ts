import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const Int8SchemaInput = defineSchemaInput({
  type: "INT8" as const,
  displayName: "INT8",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<NumberInput>) => {
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
        return { success: true };
      },
    });
  },
});

import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const Int32SchemaInput = defineSchemaInput({
  type: "INT32" as const,
  displayName: "INT32",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<NumberInput>) => {
    return createNumberInput({
      ...args,
      min: -2147483648,
      max: 2147483647,
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

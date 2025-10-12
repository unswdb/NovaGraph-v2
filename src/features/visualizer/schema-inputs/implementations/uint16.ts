import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const Uint16SchemaInput = defineSchemaInput({
  type: "UINT16" as const,
  displayName: "UINT16",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<NumberInput>) => {
    return createNumberInput({
      ...args,
      min: 0,
      max: 65535,
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

import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const FloatSchemaInput = defineSchemaInput({
  type: "FLOAT" as const,
  displayName: "FLOAT",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<NumberInput>, context: FieldContextKind) => {
    return createNumberInput({
      ...args,
      nullable: context === "non-primary",
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

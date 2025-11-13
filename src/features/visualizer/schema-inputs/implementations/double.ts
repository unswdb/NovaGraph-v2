import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const DoubleSchemaInput = defineSchemaInput({
  type: "DOUBLE" as const,
  displayName: "DOUBLE",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<NumberInput>, context: FieldContextKind) => {
    return createNumberInput({
      ...args,
      nullable: context === "non-primary",
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
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

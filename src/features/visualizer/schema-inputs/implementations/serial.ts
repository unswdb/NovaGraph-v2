import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const SerialSchemaInput = defineSchemaInput({
  type: "SERIAL" as const,
  displayName: "SERIAL",
  contexts: ["primary"],
  build: (args: PropsForInput<NumberInput>, context: FieldContextKind) => {
    return createNumberInput({
      ...args,
      nullable: context === "non-primary",
    });
  },
});

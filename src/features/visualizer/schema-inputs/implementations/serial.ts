import { createNumberInput, type NumberInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const SerialSchemaInput = defineSchemaInput<NumberInput>({
  type: "SERIAL",
  displayName: "SERIAL",
  contexts: ["primary"],
  build: (args) => {
    return createNumberInput({
      ...args,
    });
  },
});

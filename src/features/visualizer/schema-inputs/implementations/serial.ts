import {
  createNumberInput,
  type NumberInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const SerialSchemaInput = defineSchemaInput({
  type: "SERIAL" as const,
  displayName: "SERIAL",
  contexts: ["primary"],
  build: (args: PropsForInput<NumberInput>) => {
    return createNumberInput({
      ...args,
    });
  },
});

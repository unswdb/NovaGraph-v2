import { createSwitchInput, type SwitchInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const BooleanSchemaInput = defineSchemaInput<SwitchInput>({
  type: "BOOLEAN",
  displayName: "BOOLEAN",
  contexts: ["non-primary"],
  build: (args) => {
    return createSwitchInput({
      ...args,
    });
  },
});

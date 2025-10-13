import {
  createSwitchInput,
  type PropsForInput,
  type SwitchInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const BooleanSchemaInput = defineSchemaInput({
  type: "BOOL" as const,
  displayName: "BOOL",
  contexts: ["non-primary"],
  build: (args: PropsForInput<SwitchInput>) => {
    return createSwitchInput({
      ...args,
    });
  },
});

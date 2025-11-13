import {
  createSwitchInput,
  type PropsForInput,
  type SwitchInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const BooleanSchemaInput = defineSchemaInput({
  type: "BOOL" as const,
  displayName: "BOOL",
  contexts: ["non-primary"],
  build: (args: PropsForInput<SwitchInput>, context: FieldContextKind) => {
    return createSwitchInput({
      ...args,
      nullable: context === "non-primary",
    });
  },
});

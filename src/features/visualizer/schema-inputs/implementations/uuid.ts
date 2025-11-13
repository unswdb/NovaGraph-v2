import {
  createUUIDInput,
  type PropsForInput,
  type UUIDInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const UUIDSchemaInput = defineSchemaInput({
  type: "UUID" as const,
  displayName: "UUID",
  contexts: ["primary"],
  build: (args: PropsForInput<UUIDInput>, context: FieldContextKind) => {
    return createUUIDInput({
      ...args,
      nullable: context === "non-primary",
    });
  },
});

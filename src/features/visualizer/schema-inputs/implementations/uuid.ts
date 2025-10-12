import {
  createUUIDInput,
  type PropsForInput,
  type UUIDInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const UUIDSchemaInput = defineSchemaInput({
  type: "UUID" as const,
  displayName: "UUID",
  contexts: ["primary"],
  build: (args: PropsForInput<UUIDInput>) => {
    return createUUIDInput({
      ...args,
    });
  },
});

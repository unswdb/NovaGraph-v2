import { createUUIDInput, type UUIDInput } from "../../inputs/uuid";
import { defineSchemaInput } from "../types";

export const UUIDSchemaInput = defineSchemaInput<UUIDInput>({
  type: "UUID",
  displayName: "UUID",
  contexts: ["primary"],
  build: (args) => {
    return createUUIDInput({
      ...args,
    });
  },
});

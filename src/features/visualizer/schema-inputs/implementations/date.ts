import { createDateInput, type DateInput } from "../../inputs/date";
import { defineSchemaInput } from "../types";

export const DateSchemaInput = defineSchemaInput<DateInput>({
  type: "DATE",
  displayName: "DATE",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createDateInput({
      ...args,
    });
  },
});

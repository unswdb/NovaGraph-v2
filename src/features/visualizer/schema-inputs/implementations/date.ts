import type { PropsForInput } from "../../inputs";
import { createDateInput, type DateInput } from "../../inputs/date";
import { defineSchemaInput } from "../types";

export const DateSchemaInput = defineSchemaInput({
  type: "DATE" as const,
  displayName: "DATE",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<DateInput>) => {
    return createDateInput({
      ...args,
    });
  },
});

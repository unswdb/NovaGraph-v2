import type { PropsForInput } from "../../inputs";
import { createDateInput, type DateInput } from "../../inputs/date";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const DateSchemaInput = defineSchemaInput({
  type: "DATE" as const,
  displayName: "DATE",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<DateInput>, context: FieldContextKind) => {
    return createDateInput({
      ...args,
      nullable: context === "non-primary",
    });
  },
});

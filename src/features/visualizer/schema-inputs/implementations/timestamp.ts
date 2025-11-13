import {
  createDatetimeLocalInput,
  type DatetimeLocalInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const TimestampSchemaInput = defineSchemaInput({
  type: "TIMESTAMP" as const,
  displayName: "TIMESTAMP",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<DatetimeLocalInput>, context: FieldContextKind) => {
    return createDatetimeLocalInput({
      ...args,
      nullable: context === "non-primary",
    });
  },
});

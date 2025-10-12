import {
  createDatetimeLocalInput,
  type DatetimeLocalInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const TimestampSchemaInput = defineSchemaInput({
  type: "TIMESTAMP" as const,
  displayName: "TIMESTAMP",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<DatetimeLocalInput>) => {
    return createDatetimeLocalInput({
      ...args,
    });
  },
});

import {
  createDatetimeLocalInput,
  type DatetimeLocalInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const TimestampSchemaInput = defineSchemaInput<DatetimeLocalInput>({
  type: "TIMESTAMP",
  displayName: "TIMESTAMP",
  contexts: ["primary", "non-primary"],
  build: (args) => {
    return createDatetimeLocalInput({
      ...args,
    });
  },
});

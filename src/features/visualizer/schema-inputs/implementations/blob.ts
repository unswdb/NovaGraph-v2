import {
  createFileInput,
  type FileInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput } from "../types";

export const BlobSchemaInput = defineSchemaInput({
  type: "BLOB" as const,
  displayName: "BLOB",
  contexts: ["non-primary"] as const,
  build: (args: PropsForInput<FileInput>) => {
    return createFileInput({
      ...args,
    });
  },
});

import { createFileInput, type FileInput } from "../../inputs";
import { defineSchemaInput } from "../types";

export const BlobSchemaInput = defineSchemaInput<FileInput>({
  type: "BLOB",
  displayName: "BLOB",
  contexts: ["non-primary"],
  build: (args) => {
    return createFileInput({
      ...args,
    });
  },
});

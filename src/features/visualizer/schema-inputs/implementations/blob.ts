import {
  createFileInput,
  type FileInput,
  type PropsForInput,
} from "../../inputs";
import { defineSchemaInput, type FieldContextKind } from "../types";

export const BlobSchemaInput = defineSchemaInput({
  type: "BLOB" as const,
  displayName: "BLOB",
  contexts: ["non-primary"] as const,
  build: (args: PropsForInput<FileInput>, context: FieldContextKind) => {
    return createFileInput({
      ...args,
      nullable: context === "non-primary",
      validator: (value: File) => {
        const maxLimit = 4 * 1024; // 4 Kb
        if (value.size > maxLimit) {
          return { success: false, message: "File size must not exceed 4 KB" };
        }
        return { success: true };
      },
    });
  },
});

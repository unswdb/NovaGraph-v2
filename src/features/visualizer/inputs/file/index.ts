import type { BaseInputType } from "../types";
import type { FileInput, FileValues } from "./types";

export function createFileInput(
  input: Partial<FileInput> & BaseInputType<FileValues>
): FileInput {
  return {
    type: "file",
    accept: "*/*",
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { FileInput } from "./types";
export { default as FileInputComponent } from "./file-input";

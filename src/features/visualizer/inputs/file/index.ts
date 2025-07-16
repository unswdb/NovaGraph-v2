import type { BaseInputType } from "../types";
import type { FileInput } from "./types";

export function createFileInput(
  input: Partial<FileInput> & BaseInputType<File>
): FileInput {
  return {
    type: "file",
    accept: "*/*",
    ...input,
  };
}

export type { FileInput } from "./types";
export { default as FileInputComponent } from "./file-input";

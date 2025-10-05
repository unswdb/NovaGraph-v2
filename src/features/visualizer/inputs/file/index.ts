import type { FileInput, PropsForFile } from "./types";

export function createFileInput(input: PropsForFile<FileInput>): FileInput {
  return {
    type: "file",
    accept: "*/*",
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { FileInput, ValueForFile, PropsForFile } from "./types";
export { default as FileInputComponent } from "./file-input";

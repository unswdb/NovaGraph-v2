import type { BaseInputType } from "../types";

export type FileValues = File;

export type FileInput = BaseInputType<FileValues> & {
  type: "file";
  accept?: string;
};

export type ValueForFile<I> = I extends FileInput ? FileValues : never;

export type PropsForFile<I> = I extends FileInput
  ? Partial<FileInput> & BaseInputType<FileValues>
  : never;

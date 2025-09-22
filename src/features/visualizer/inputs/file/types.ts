import type { BaseInputType } from "../types";

export type FileValues = File | undefined;

export type FileInput = BaseInputType<FileValues> & {
  type: "file";
  accept?: string;
};

export type ValueForFile<I> = I extends FileInput ? FileValues : never;

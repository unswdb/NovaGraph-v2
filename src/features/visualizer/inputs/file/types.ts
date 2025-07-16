import type { BaseInputType } from "../types";

export type FileInput = BaseInputType<File> &{
  type: "file";
  required?: boolean;
  accept?: string;
};

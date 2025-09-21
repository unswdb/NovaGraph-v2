import type { BaseInputType } from "../types";

export type FileInput = BaseInputType<File> &{
  type: "file";
  accept?: string;
};

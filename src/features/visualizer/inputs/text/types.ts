import type { BaseInputType } from "../types";

export type TextInput = BaseInputType<string> &{
  type: "text";
  required?: boolean;
  placeholder?: string;
};

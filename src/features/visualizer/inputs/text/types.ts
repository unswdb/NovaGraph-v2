import type { BaseInputType } from "../types";

export type TextInput = BaseInputType<string> &{
  type: "text";
  placeholder?: string;
  defaultValue?: string;
};

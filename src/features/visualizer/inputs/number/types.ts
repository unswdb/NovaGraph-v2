import type { BaseInputType } from "../types";

export type NumberInput = BaseInputType<number> & {
  type: "number";
  required?: boolean;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
};

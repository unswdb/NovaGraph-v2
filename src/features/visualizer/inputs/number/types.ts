import type { BaseInputType } from "../types";

export type NumberValues = number | "";

export type NumberInput = BaseInputType<NumberValues> & {
  type: "number";
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
};

export type ValueForNumber<I> = I extends NumberInput ? NumberValues : never;

import type { BaseInputType } from "../types";

export type NumberValues = number;

export type NumberInput = BaseInputType<NumberValues> & {
  type: "number";
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

export type ValueForNumber<I> = I extends NumberInput ? NumberValues : never;

export type PropsForNumber<I> = I extends NumberInput
  ? Partial<NumberInput> & BaseInputType<NumberValues>
  : never;

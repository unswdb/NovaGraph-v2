import type { BaseInputType } from "../types";

export type TextValues = string;

export type TextInput = BaseInputType<TextValues> & {
  type: "text";
};

export type ValueForText<I> = I extends TextInput ? TextValues : never;

export type PropsForText<I> = I extends TextInput
  ? Partial<TextInput> & BaseInputType<TextValues>
  : never;

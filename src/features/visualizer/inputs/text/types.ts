import type { BaseInputType } from "../types";

export type TextValues = string;

export type TextInput = BaseInputType<TextValues> &{
    type: "text";
    placeholder?: string;
    defaultValue?: string;
};

export type ValueForText<I> = I extends TextInput ? TextValues : never;
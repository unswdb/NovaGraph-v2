import type { AlgorithmSelectInput } from "./algorithms/select/types";
import type { FileInput } from "./file";
import type { NumberInput } from "./number";
import type { SwitchInput } from "./switch";
import type { TextInput } from "./text";

export type InputType =
  | TextInput
  | NumberInput
  | SwitchInput
  | FileInput
  | AlgorithmSelectInput;
export type InputValueType =
  | string
  | number
  | boolean
  | File
  | undefined;
type InputResultType = { success: boolean; message?: string };
export type InputChangeResult = { value: InputValueType } & InputResultType;

export type InputComponentProps<T = InputType> = {
  input: T;
  value: InputValueType;
  onChange: (result: InputChangeResult) => void;
};

export type BaseInputType<T extends InputValueType = InputValueType> = {
  id: string;
  label: string;
  validator?: (
    value: T,
    ...props: any[]
  ) => InputResultType | Promise<InputResultType>;
};

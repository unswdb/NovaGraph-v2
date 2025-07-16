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
export type InputValueType = string | number | boolean | File | FileList | undefined;

export type InputComponentProps<T = InputType> = {
  input: T;
  value: InputValueType;
  onChange: (value: InputValueType) => void;
};

type InputResultType = { success: boolean; message?: string };

export type BaseInputType = {
  id: string;
  label: string;
  validator?: (
    value: string,
    ...props: any[]
  ) => InputResultType | Promise<InputResultType>;
};

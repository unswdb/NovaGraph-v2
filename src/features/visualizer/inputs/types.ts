import type {
  AlgorithmSelectInput,
  ValueForAlgorithmSelect,
} from "./algorithms/select/types";
import type { FileInput } from "./file";
import type { ValueForFile } from "./file/types";
import type { NumberInput } from "./number";
import type { ValueForNumber } from "./number/types";
import type { SwitchInput } from "./switch";
import type { ValueForSwitch } from "./switch/types";
import type { TextInput } from "./text";
import type { ValueForText } from "./text/types";

export type InputType =
  | TextInput
  | NumberInput
  | SwitchInput
  | FileInput
  | AlgorithmSelectInput;

export type ValueForInput<I> =
  | ValueForText<I>
  | ValueForNumber<I>
  | ValueForSwitch<I>
  | ValueForFile<I>
  | ValueForAlgorithmSelect<I>;

type InputResultType = { success: boolean; message?: string };
export type InputChangeResult<T> = { value: T } & InputResultType;

export type BaseInputType<T> = {
  id: string;
  label: string;
  required?: boolean;
  showLabel?: boolean;
  disabled?: boolean;
  validator?: (
    value: T,
    ...props: any[]
  ) => InputResultType | Promise<InputResultType>;
};

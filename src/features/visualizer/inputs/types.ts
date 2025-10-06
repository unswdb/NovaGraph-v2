import type {
  AlgorithmSelectInput,
  PropsForAlgorithmSelect,
  ValueForAlgorithmSelect,
} from "./algorithms/select";
import type { DateInput, PropsForDate, ValueForDate } from "./date";
import type {
  DatetimeLocalInput,
  PropsForDatetimeLocal,
  ValueForDatetimeLocal,
} from "./date/datetime-local";
import type { FileInput, PropsForFile, ValueForFile } from "./file";
import type { NumberInput, PropsForNumber, ValueForNumber } from "./number";
import type { PropsForSwitch, SwitchInput, ValueForSwitch } from "./switch";
import type { PropsForText, TextInput, ValueForText } from "./text";

export type InputType =
  | TextInput
  | NumberInput
  | SwitchInput
  | FileInput
  | DateInput
  | DatetimeLocalInput
  | AlgorithmSelectInput;

export type ValueForInput<I> =
  | ValueForText<I>
  | ValueForNumber<I>
  | ValueForSwitch<I>
  | ValueForFile<I>
  | ValueForDate<I>
  | ValueForDatetimeLocal<I>
  | ValueForAlgorithmSelect<I>;

export type PropsForInput<I> =
  | PropsForText<I>
  | PropsForNumber<I>
  | PropsForSwitch<I>
  | PropsForFile<I>
  | PropsForDate<I>
  | PropsForDatetimeLocal<I>
  | PropsForAlgorithmSelect<I>;

type InputResultType = { success: boolean; message?: string };
export type InputChangeResult<T> = { value: T } & InputResultType;

export interface BaseInputType<T> {
  id: string;
  key: string;
  displayName: string;
  required?: boolean;
  showLabel?: boolean;
  disabled?: boolean;
  defaultValue?: T;
  validate?: boolean;
  validator?: (
    value: T,
    ...props: any[]
  ) => InputResultType | Promise<InputResultType>;
}

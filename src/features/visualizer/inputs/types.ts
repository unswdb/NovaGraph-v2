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
import type { PropsForUUID, UUIDInput, ValueForUUID } from "./uuid";

export type InputType =
  | TextInput
  | NumberInput
  | SwitchInput
  | FileInput
  | DateInput
  | DatetimeLocalInput
  | AlgorithmSelectInput
  | UUIDInput;

export type ValueForInput<I> =
  | ValueForText<I>
  | ValueForNumber<I>
  | ValueForSwitch<I>
  | ValueForFile<I>
  | ValueForDate<I>
  | ValueForDatetimeLocal<I>
  | ValueForAlgorithmSelect<I>
  | ValueForUUID<I>;

export type PropsForInput<I> =
  | PropsForText<I>
  | PropsForNumber<I>
  | PropsForSwitch<I>
  | PropsForFile<I>
  | PropsForDate<I>
  | PropsForDatetimeLocal<I>
  | PropsForAlgorithmSelect<I>
  | PropsForUUID<I>;

type InputResultType = { success: boolean; message?: string };
export type InputChangeResult<T> = { value: T } & InputResultType;

export interface BaseInputType<T> {
  id: string; // Unique identifier for the input
  key: string; // Key used to store the InputChangeResult object
  displayName: string; // Label or display name of the input
  required?: boolean; // Whether the input is required
  showLabel?: boolean; // Whether to show the label/display name
  disabled?: boolean; // Whether the input is disabled
  defaultValue?: T; // Default value of the input
  validate?: boolean; // Whether validation is enabled
  validator?: ( // Custom validator function to run on top of basic validation
    value: T,
    ...props: any[]
  ) => InputResultType | Promise<InputResultType>;
}

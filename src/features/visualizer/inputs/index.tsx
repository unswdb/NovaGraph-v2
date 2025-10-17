import AlgorithmSelectInputComponent from "./algorithms/select/select-input";
import { DateInputComponent } from "./date";
import { DatetimeLocalInputComponent } from "./date/datetime-local";
import { FileInputComponent } from "./file";
import { NumberInputComponent } from "./number";
import { SwitchInputComponent } from "./switch";
import TextInputComponent from "./text/text-input";
import { UUIDInputComponent } from "./uuid";

import type { InputChangeResult, InputType, ValueForInput } from "./types";

import { Label } from "~/components/form/label";

export type InputComponentProps<I extends InputType> = {
  input: I;
  value: ValueForInput<I> | undefined;
  onChange: (result: InputChangeResult<ValueForInput<I> | undefined>) => void;
};

const INPUT_COMPONENTS: Record<InputType["type"], React.ComponentType<any>> = {
  text: TextInputComponent,
  number: NumberInputComponent,
  switch: SwitchInputComponent,
  file: FileInputComponent,
  date: DateInputComponent,
  "algorithm-select": AlgorithmSelectInputComponent,
  "datetime-local": DatetimeLocalInputComponent,
  uuid: UUIDInputComponent,
} as const;

export default function InputComponent<T extends InputType>({
  input,
  value,
  onChange,
}: InputComponentProps<T>) {
  const InputComponent = INPUT_COMPONENTS[input.type];

  if (!InputComponent) {
    return null;
  }

  return (
    <div className="space-y-2">
      {!!input.showLabel && (
        <Label htmlFor={input.id}>{input.displayName}</Label>
      )}
      <InputComponent
        id={input.id}
        input={input}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function hasDefaultValue<T extends InputType>(
  input: T
): input is T & { defaultValue: ValueForInput<T> } {
  return "defaultValue" in input;
}

// Function to define empty records for inputs
export function createEmptyInputResult<I extends InputType>(
  input: I
): InputChangeResult<ValueForInput<I> | undefined> {
  const defaultValueExists = hasDefaultValue(input);
  const value = defaultValueExists ? input.defaultValue : undefined;
  const isValueDefined = value !== undefined;
  const result = {
    value,
    success: input.required ? isValueDefined || !input.validate : true,
    message: input.required
      ? isValueDefined || !input.validate
        ? ""
        : "This field is required"
      : "",
  };
  return result;
}

export function createEmptyInputResults(inputs: InputType[]) {
  return inputs.reduce<Record<string, InputChangeResult<any>>>((acc, input) => {
    acc[input.key] = createEmptyInputResult(input);
    return acc;
  }, {});
}

export {
  type InputType,
  type InputChangeResult,
  type ValueForInput,
  type PropsForInput,
} from "./types";

export { createTextInput, type TextInput } from "./text";
export { createFileInput, type FileInput } from "./file";
export { createSwitchInput, type SwitchInput } from "./switch";
export {
  createAlgorithmSelectInput,
  type AlgorithmSelectInput,
} from "./algorithms/select";
export { createNumberInput, type NumberInput } from "./number";
export {
  createDatetimeLocalInput,
  type DatetimeLocalInput,
} from "./date/datetime-local";
export { createDateInput, type DateInput } from "./date";
export { createUUIDInput, type UUIDInput } from "./uuid";

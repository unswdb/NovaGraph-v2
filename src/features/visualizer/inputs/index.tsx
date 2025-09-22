import { Label } from "~/components/form/label";
import AlgorithmSelectInputComponent from "./algorithms/select/select-input";
import { NumberInputComponent } from "./number";
import type { InputChangeResult, InputType, ValueForInput } from "./types";
import { FileInputComponent } from "./file";
import { SwitchInputComponent } from "./switch";
import TextInputComponent from "./text/text-input";

export type InputComponentProps<T extends InputType> = {
  input: T;
  value: ValueForInput<T>;
  onChange: (result: InputChangeResult<ValueForInput<T>>) => void;
};

const INPUT_COMPONENTS: Record<InputType["type"], React.ComponentType<any>> = {
  text: TextInputComponent,
  number: NumberInputComponent,
  switch: SwitchInputComponent,
  file: FileInputComponent,
  "algorithm-select": AlgorithmSelectInputComponent,
} as const;

export default function InputComponent<T extends InputType>({
  input,
  value,
  onChange,
}: InputComponentProps<T>) {
  const InputComponent = INPUT_COMPONENTS[input.type];

  if (!InputComponent) {
    console.warn(`Unknown input type: ${input.type}`);
    return null;
  }

  return (
    <div className="space-y-2">
      {!!input.showLabel && <Label htmlFor={input.id}>{input.label}</Label>}
      <InputComponent input={input} value={value} onChange={onChange} />
    </div>
  );
}

function hasDefaultValue<T extends InputType>(
  input: T
): input is T & { defaultValue: ValueForInput<T> } {
  return "defaultValue" in input;
}

// Function to define empty records for input values
export function createEmptyInputResults(inputs: InputType[]) {
  return inputs.reduce<Record<string, InputChangeResult<any>>>((acc, input) => {
    const defaultValueExists = hasDefaultValue(input);
    acc[input.label] = {
      value: defaultValueExists ? input.defaultValue : undefined,
      success: input.required ? defaultValueExists : true,
      message: input.required
        ? defaultValueExists
          ? ""
          : "This field is required"
        : "",
    };
    return acc;
  }, {});
}

export { type InputType, type InputChangeResult } from "./types";

export { createTextInput } from "./text";
export { createFileInput } from "./file";
export { createSwitchInput } from "./switch";
export { createAlgorithmSelectInput } from "./algorithms/select";
export { createNumberInput } from "./number";

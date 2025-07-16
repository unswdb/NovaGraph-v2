import { Label } from "~/components/form/label";
import AlgorithmSelectInputComponent from "./algorithms/select/select-input";
import { NumberInputComponent } from "./number";
import type { InputComponentProps, InputType, InputValueType } from "./types";
import { FileInputComponent } from "./file";
import { SwitchInputComponent } from "./switch";
import TextInputComponent from "./text/text-input";

const INPUT_COMPONENTS: Record<InputType["type"], React.ComponentType<any>> = {
  text: TextInputComponent,
  number: NumberInputComponent,
  switch: SwitchInputComponent,
  file: FileInputComponent,
  "algorithm-select": AlgorithmSelectInputComponent,
} as const;

export default function InputComponent({
  input,
  value,
  onChange,
}: InputComponentProps) {
  const InputComponent = INPUT_COMPONENTS[input.type];

  if (!InputComponent) {
    console.warn(`Unknown input type: ${input.type}`);
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={input.id}>{input.label}</Label>
      <InputComponent input={input} value={value} onChange={onChange} />
    </div>
  );
}

function hasDefaultValue(
  input: InputType
): input is InputType & { defaultValue: InputValueType } {
  return "defaultValue" in input;
}

// Function to define empty records for input values
export function createEmptyInputResults(inputs: InputType[]) {
  return inputs.reduce<
    Record<string, { value: InputValueType; success: boolean }>
  >((acc, input) => {
    const defaultValueExists = hasDefaultValue(input);
    acc[input.label] = {
      value: defaultValueExists ? input.defaultValue : undefined,
      success: defaultValueExists,
    };
    return acc;
  }, {});
}

export {
  type InputType,
  type InputChangeResult,
  type InputComponentProps,
} from "./types";

export { createTextInput } from "./text";
export { createFileInput } from "./file";
export { createSwitchInput } from "./switch";
export { createAlgorithmSelectInput } from "./algorithms/select";
export { createNumberInput } from "./number";

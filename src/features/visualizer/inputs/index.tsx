import { Label } from "~/components/form/label";
import AlgorithmSelectInputComponent from "./algorithms/select/select-input";
import { NumberInputComponent } from "./number";
import type { InputComponentProps, InputType } from "./types";
import { FileInputComponent } from "./file";
import { SwitchInputComponent } from "./switch";
import TextInputComponent from "./text/text-input";

export const INPUT_COMPONENTS: Record<
  InputType["type"],
  React.ComponentType<any>
> = {
  text: TextInputComponent,
  number: NumberInputComponent,
  switch: SwitchInputComponent,
  file: FileInputComponent,
  "algorithm-select": AlgorithmSelectInputComponent,
} as const;
export type InputComponentType = keyof typeof INPUT_COMPONENTS;

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

export * from "./types";

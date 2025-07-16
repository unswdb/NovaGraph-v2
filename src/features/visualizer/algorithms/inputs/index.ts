import { NumberInputComponent, type NumberInput } from "./number";
import { SelectInputComponent, type SelectInput } from "./select";

export type GraphAlgorithmInput = SelectInput | NumberInput;

export const INPUT_COMPONENTS: Record<
  GraphAlgorithmInput["type"],
  React.ComponentType<any>
> = {
  select: SelectInputComponent,
  number: NumberInputComponent,
} as const;
export type InputComponentType = keyof typeof INPUT_COMPONENTS;

export * from "./types";

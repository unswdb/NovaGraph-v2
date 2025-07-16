import { Input } from "~/components/form/input";
import type { AlgorithmInputComponentProps } from "../types";
import type { NumberInput } from "./types";

export default function NumberInputComponent({
  input,
  value,
  onChange,
}: AlgorithmInputComponentProps<NumberInput>) {
  return (
    <Input
      type="number"
      min={input.min ?? 0}
      max={input.max}
      value={String(value) ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

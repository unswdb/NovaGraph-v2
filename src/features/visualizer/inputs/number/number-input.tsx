import { Input } from "~/components/form/input";
import type { NumberInput } from "./types";
import type { InputComponentProps } from "../types";
import { Label } from "@radix-ui/react-label";

export default function NumberInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<NumberInput>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={input.id}>{input.label}</Label>
      <Input
        id={input.id}
        type="number"
        min={input.min ?? 0}
        max={input.max}
        value={String(value) ?? ""}
        required={input.required}
        placeholder={input.placeholder}
        defaultValue={input.defaultValue?.toString() ?? ""}
        onChange={(e) =>
          onChange({ value: Number(e.target.value), success: true })
        }
      />
    </div>
  );
}

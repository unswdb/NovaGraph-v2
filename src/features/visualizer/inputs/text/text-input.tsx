import { Input } from "~/components/form/input";
import type { InputComponentProps } from "../types";
import type { TextInput } from "./types";

export default function TextInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<TextInput>) {
  return (
    <Input
      id={input.id}
      type="text"
      value={value ? String(value) : ""}
      onChange={(e) => onChange(e.target.value)}
      required={input.required}
      placeholder={input.placeholder}
      defaultValue={input.defaultValue}
    />
  );
}

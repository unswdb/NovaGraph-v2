import { Switch } from "~/components/form/switch";
import type { InputComponentProps } from "../types";
import type { SwitchInput } from "./types";

export default function SwitchInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<SwitchInput>) {
  return (
    <Switch
      id={input.id}
      checked={!!value}
      onCheckedChange={(checked) => onChange(checked)}
      defaultChecked={input.defaultValue}
    />
  );
}

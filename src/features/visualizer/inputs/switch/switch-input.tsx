import { Switch } from "~/components/form/switch";
import type { SwitchInput } from "./types";
import type { InputComponentProps } from "..";

export default function SwitchInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<SwitchInput>) {
  return (
    <Switch
      id={input.id}
      checked={!!value}
      onCheckedChange={(checked) => onChange({ value: checked, success: true })}
      defaultChecked={input.defaultValue}
    />
  );
}

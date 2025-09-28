import { Switch } from "~/components/form/switch";
import type { SwitchInput } from "./types";
import type { InputComponentProps } from "..";
import { useEffect } from "react";

export default function SwitchInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<SwitchInput>) {
  useEffect(() => {
    if (input.defaultValue) {
      onChange({ value: input.defaultValue, success: true });
    }
  }, [input.defaultValue]);

  return (
    <Switch
      id={input.id}
      checked={!!value}
      onCheckedChange={(checked) => onChange({ value: checked, success: true })}
      defaultChecked={input.defaultValue}
    />
  );
}

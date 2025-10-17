import { useEffect } from "react";

import type { InputComponentProps } from "..";
import type { SwitchInput } from "./types";

import { Switch } from "~/components/form/switch";

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

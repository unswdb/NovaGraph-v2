import type { BaseInputType } from "../types";

export type SwitchValues = boolean;

export type SwitchInput = BaseInputType<SwitchValues> & {
  type: "switch";
  defaultValue?: boolean;
};

export type ValueForSwitch<I> = I extends SwitchInput ? SwitchValues : never;

export type PropsForSwitch<I> = I extends SwitchInput
  ? Partial<SwitchInput> & BaseInputType<SwitchValues>
  : never;

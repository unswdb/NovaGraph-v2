import type { BaseInputType } from "../types";

export type SwitchValues = boolean;

export type SwitchInput = BaseInputType<SwitchValues> & {
  type: "switch";
  defaultValue?: boolean;
};

export type ValueForSwitch<I> = I extends SwitchInput ? SwitchValues : never;

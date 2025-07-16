import type { BaseInputType } from "../types";

export type SwitchInput = BaseInputType<boolean> & {
  type: "switch";
  required?: boolean;
  defaultValue?: boolean;
};

export type SwitchInput = {
  id: string;
  label: string;
  type: "switch";
  defaultValue?: boolean;
  validator?: (
    value: boolean[]
  ) => Promise<{ success: boolean; message?: string }>;
};

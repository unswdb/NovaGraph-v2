export type NumberInput = {
  id: string;
  label: string;
  type: "number";
  required?: boolean;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
};

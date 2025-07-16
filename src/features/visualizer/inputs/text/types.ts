import type { GraphDatabase } from "~/features/visualizer/types";

export type TextInput = {
  id: string;
  label: string;
  type: "text";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  validator?: (
    value: string,
    databases?: GraphDatabase[]
  ) => Promise<{ success: boolean; message?: string }>;
};

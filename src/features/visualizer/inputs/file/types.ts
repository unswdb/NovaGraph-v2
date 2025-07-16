export type FileInput = {
  id: string;
  label: string;
  type: "file";
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  validator?: (
    files: File[]
  ) => Promise<{ success: boolean; message?: string }>;
};

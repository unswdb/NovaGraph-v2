import type { ElementType } from "react";
import type { GraphDatabase } from "~/features/visualizer/types";

type FileInput = {
    id: string;
  label: string;
  type: "file";
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  validator?: (files: File[]) => Promise<{ success: boolean, message?: string }>;
};

type SwitchInput = {
    id: string;
  label: string;
  type: "switch";
  defaultValue?: boolean;
  validator?: (value: boolean[]) => Promise<{ success: boolean, message?: string }>;
};

type StringInput = {
    id: string;
  label: string;
  type: "text";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  validator?: (value: string, databases?: GraphDatabase[]) => Promise<{ success: boolean, message?: string }>;
};

type NumberInput = {
    id: string;
  label: string;
  type: "number";
  required?: boolean;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  validator?: (value: number) => Promise<{ success: boolean, message?: string }>;
};

export type ImportInput = FileInput | SwitchInput | StringInput | NumberInput;

type ImportHandler = (data: {
  values: Record<string, any>;
}) => Promise<{ success: boolean; message?: string }>;

type ImportValidator = (data: {
    values: Record<string, any>;
}) => { success: boolean; message?: string };

export interface ImportOption {
  // Display information for the menu
  label: string;
  value: string;
  icon: ElementType;

  // Display information for the input dialog
  title: string;
  description?: string;
  previewTitle?: string;
  previewDescription?: string;
  preview: ElementType;
  note?: string;
  inputs: ImportInput[];
  validator?: ImportValidator;
  handler: ImportHandler;
};

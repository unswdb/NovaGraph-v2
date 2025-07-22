import type { ElementType } from "react";
import type { InputType } from "~/features/visualizer/inputs";

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
  preview?: ElementType;
  note?: string;
  inputs: InputType[];
  validator?: ImportValidator;
  handler: ImportHandler;
};

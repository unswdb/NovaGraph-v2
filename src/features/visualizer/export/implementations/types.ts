import type { ElementType } from "react";

export interface ExportOption {
  // Display information for the menu
  label: string;
  value: string;
  icon: ElementType;

  // For export functionality
  mimeType: string;
  export: (data: Record<string, any>) => void;
}

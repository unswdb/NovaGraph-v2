import type { ElementType } from "react";

export interface ExportOption {
  // Display information for the menu
  label: string;
  value: string;
  icon: ElementType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export: (data: Record<string, any>) => void;
}

import type { ElementType } from "react";

import type {
  GraphNode,
  GraphEdge,
  NodeSchema,
  EdgeSchema,
  GraphSnapshotState,
} from "../../types";
import type VisualizerStore from "../../store";

import type {
  InputChangeResult,
  InputType,
} from "~/features/visualizer/inputs";

type ImportHandlerResult = GraphSnapshotState & {
  databaseName: string;
};

type ImportHandler = (data: {
  values: Record<string, InputChangeResult<any>>;
  controller: VisualizerStore["controller"];
}) => Promise<ImportHandlerResult>;

type ImportValidator = (data: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: Record<string, InputChangeResult<any>>;
}) => {
  success: boolean;
  message?: string;
};

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
}

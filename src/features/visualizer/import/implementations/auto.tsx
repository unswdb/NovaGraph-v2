import { Table as TableIcon } from "lucide-react";

import type { ImportOption } from "./types";

export const ImportAuto: ImportOption = {
  label: "Generate Graph",
  value: "manual-generate-graph",
  icon: TableIcon,
  title: "Generate Random Graph",
  description:
    "This function will generate a random graph based on the Erdős-Rényi model. Enter the number of nodes and a probability value between 0 and 1 to generate a graph. The probability value represents the likelihood of an edge existing between two nodes.",
  inputs: [],
  handler: async ({ values }: { values: Record<string, any> }) => {
    return { success: true };
  },
};

import { LaptopMinimal, Table as TableIcon } from "lucide-react";

import { createTextInput } from "../../inputs";

import type { ImportOption } from "./types";

export const ImportAuto: ImportOption = {
  label: "New Empty Graph",
  value: "generate-empty-graph",
  icon: LaptopMinimal,
  title: "New Empty Graph",
  description:
    "Creates a new persistent graph workspace containing no schemas, nodes, or edges. Ideal for starting a fresh project.",
  inputs: [
    createTextInput({
      id: "database-name-empty-graph",
      key: "name",
      displayName: "Name of the database",
      required: true,
      placeholder: "Enter a name for the database...",
    }),
  ],
  handler: async ({}: { values: Record<string, any>; controller: any }) => {
    return { success: true };
  },
};

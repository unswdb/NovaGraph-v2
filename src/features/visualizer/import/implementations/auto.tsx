import { LaptopMinimal } from "lucide-react";

import { createTextInput } from "../../inputs";
import type VisualizerStore from "../../store";

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
  handler: async ({
    values,
    controller,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: Record<string, any>;
    controller: VisualizerStore["controller"];
  }) => {
    const { name } = values;
    const databaseName = (name.value as string).trim();

    await controller.db.createDatabase(databaseName);
    await controller.db.connectToDatabase(databaseName);
    const { nodes, edges, nodeTables, edgeTables, directed } =
      await controller.db.snapshotGraphState();

    return {
      databaseName: databaseName,
      nodes,
      edges,
      nodeTables,
      edgeTables,
      directed: directed ?? true,
    };
  },
};

import { LaptopMinimal } from "lucide-react";

import { createSwitchInput, createTextInput } from "../../inputs";
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
    createSwitchInput({
      id: "directed-graph-empty",
      key: "isDirected",
      displayName: "Directed Graph",
      defaultValue: true,
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
    const { name, isDirected } = values;
    const databaseName = name.value as string;
    const directed = Boolean(isDirected?.value ?? true);

    await controller.db.createDatabase(databaseName, { isDirected: directed });
    await controller.db.connectToDatabase(databaseName);
    const snapshot = await controller.db.snapshotGraphState();

    return {
      databaseName,
      ...snapshot,
      directed: snapshot.directed ?? directed,
    };
  },
};

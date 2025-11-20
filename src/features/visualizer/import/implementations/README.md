# Extending Import Options for NovaGraph Visualizer

The `import/` folder contains implementations of data import options that allow users to bring graph data into NovaGraph (e.g. from CSV or JSON). Each import option is defined using the `ImportOption` interface in `import/implementations/types.ts` and registered so it appears in the Import menu. This guide explains how to add a new import option.

## Steps to Extend Import Options

### 1. Create a New Import File

To create a new import option:

- Create a new file under `import/implementations/` with a descriptive name (e.g. `csv.ts`, `json.ts`).

### 2. Define the ImportOption

Inside your new file, define the import option based on the `ImportOption` type from `implementations/types.ts`:

```ts
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

  // function to define form/data validation
  // return { success: boolean, message?: string }
  validator?: ImportValidator;

  // function that performs the actual import
  handler: ImportHandler;
}
```

Key fields:

- **label**: Human-readable label shown in the Import menu.
- **value**: Unique identifier for this import option. This must be unique across all imports.
- **icon**: Icon component (e.g. from `lucide-react`) displayed in the menu.
- **title / description**: Title and description for the dialog shown when configuring the import.
- **previewTitle / previewDescription / preview**: Optional preview section for showing expected file format or examples.
- **note**: Optional markdown note for edge cases, warnings, or tips.
- **inputs**: An array of input definitions (e.g. text fields, file pickers) created using helpers like `createTextInput` and `createFileInput`.
- **validator**: Optional validator for the combined form values.
- **handler**: Async function that performs the actual import using the `VisualizerStore` controller.

#### Example Implementation

```ts
export const ImportCSV: ImportOption = {
  label: "Import as CSV",
  value: "csv",
  icon: TableIcon,
  title: "Import CSV Files",
  description:
    "Upload your graph data by selecting two CSV files: one for nodes and one for edges. The node table name will be taken from the filename (without .csv). The first column in nodes.csv will be the primary key, and all columns will be imported as node properties. Edges.csv should have source and target columns (matching the node primary key), with optional weight column and other additional columns.",
  previewTitle: "CSV Format Preview",
  previewDescription: "Expected format for nodes.csv and edges.csv files",
  preview: CSVPreview,
  note: "The 'weight' column in edges.csv is **optional**! Novagraph assumes the presence of 'weight' signifies a weighted graph. Edges in a directed graph have directions. Edges in an undirected graph are bi-directional.",
  inputs: [
    createTextInput({
      id: "database-name-csv",
      key: "name",
      displayName: "Name of the database",
      required: true,
      placeholder: "Enter a name for the database...",
    }),
    createFileInput({
      id: "nodes-csv",
      key: "nodes",
      displayName: "nodes.csv",
      required: true,
      accept: ".csv",
      validator: validateNodes,
    }),
    createFileInput({
      id: "edges-csv",
      key: "edges",
      displayName: "edges.csv",
      required: true,
      accept: ".csv",
      validator: validateEdges,
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
    const { name, nodes, edges } = values;

    const databaseName = name.value as string;
    const nodesFile = nodes.value as File;
    const edgesFile = edges.value as File;

    const nodesText = await nodesFile.text();
    const edgesText = await edgesFile.text();

    const nodeTableName = nodesFile.name.replace(/\.csv$/i, "");
    const edgeTableName = edgesFile.name.replace(/\.csv$/i, "");

    let databaseCreated = false;
    try {
      await controller.db.createDatabase(databaseName);
      databaseCreated = true;

      await controller.db.connectToDatabase(databaseName);

      const result = await controller.db.importFromCSV(
        databaseName,
        nodesText,
        edgesText,
        nodeTableName,
        edgeTableName
      );

      await controller.db.saveDatabase();
      return result;
    } catch (err) {
      if (databaseCreated) {
        await controller.db.deleteDatabase(databaseName);
      }
      throw err;
    }
  },
};
```

### 3. Implement the Handler Correctly

When implementing the `handler`, follow this pattern:

1. **Extract and parse values** from the `values` object (e.g. form fields, files).
2. **Create and connect to a database** via `controller.db.createDatabase` and `controller.db.connectToDatabase`.
3. **Perform the import** using the appropriate method (e.g. `importFromCSV`, `importFromJSON`, etc).
4. **Persist the database** using `controller.db.saveDatabase()`.
5. **Clean up on failure**: if anything throws, delete the newly created database to avoid leaving partial state.

This keeps import behavior consistent across different formats.

### 4. Register the Import Option

After defining your `ImportOption`, register it in `import/implementations/index.ts` so it becomes available throughout the app.

```ts
// Export all import options
const ALL_IMPORTS: ImportOption[] = [
  ...Object.values(ImportCSV),
  ...Object.values(ImportJSON),
];
```

## Notes

- Make sure each field in `values` within the handler function is unique across all imports to avoid clashes in the UI.
- Keep labels and descriptions user-friendly and aligned with the existing options.
- Use `preview` and `note` for anything that helps users structure their data correctly (sample schemas, CSV/JSON examples, caveats, etc).

## Conclusion

With this guide, you can extend NovaGraph’s import system to support new data formats. Ensure proper validation, compatibility, and registration for each new import to maintain consistency and reliability across the codebase.

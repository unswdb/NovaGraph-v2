# Extending Export Options for NovaGraph Visualizer

The `export/implementations/` folder contains implementations for exporting results produced by algorithms and/or queries. Each export option is defined using the `ExportOption` interface in `export/implementations/types.ts` and registered so it appears in the Export menu. This guide explains how to add a new export option.

## Steps to Extend Export Options

### 1. Create a New File

To create a new export option:

- Create a new file under `export/implementations/` with a descriptive file name (e.g. `json.ts`, `yaml.ts`).

### 2. Define the Export Option

Inside your new file, define the export based on the `ExportOption` interface from `implementations/types.ts`.

```ts
export interface ExportOption {
  label: string;
  value: string;
  icon: ElementType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export: (data: Record<string, any>) => void | Promise<void>;
}
```

Key fields:

- **label**: Human-readable label shown in the Export menu.
- **value**: Unique identifier for this export option (used internally).
- **icon**: Icon component (e.g. from `lucide-react`) displayed next to the option.
- **export**: Function that receives the data to be exported and triggers the file download (or any other export behavior).

#### Example Implementation (JSON Export)

```ts
import { FileCode2 } from "lucide-react";

import { downloadFile } from "../utils";
import type { ExportOption } from "./types";

export const ExportJSON: ExportOption = {
  label: "Export to JSON",
  value: "export-to-json",
  icon: FileCode2,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export: (data: Record<string, any>) => {
    const json = JSON.stringify(data, (_, value) => stringifySafe(value), 2);
    downloadFile(json, "data.json", "application/json");
  },
};
```

**Note**: Use the shared `downloadFile` helper from `export/utils.ts` to trigger downloads. You don’t need to re-implement the download logic.

`downloadFile` takes three arguments:

- `content`: The file contents as a string.
- `fileName`: The name of the file to be downloaded.
- `mimeType`: The MIME type of the file (e.g. `"text/yaml"`, `"application/json"`).

You can also use `stringifySafe` which apply custom serialization (e.g. handling `bigint`) before calling `downloadFile`.

### 3. Register the Export Option

After defining your `ExportOption`, register it in `export/implementations/index.ts` so it becomes available throughout the app.

```ts
const ALL_EXPORTS: ExportOption[] = [
  ...Object.values(ExportJSON),
  ...Object.values(ExportYAML),
];
```

## Notes

Keep labels and descriptions user-friendly and aligned with the existing options.

## Conclusion

By following this guide, you can extend NovaGraph’s export system to support new file formats and workflows. Ensure proper validation, compatibility, and registration for each new import to maintain consistency and reliability across the codebase.

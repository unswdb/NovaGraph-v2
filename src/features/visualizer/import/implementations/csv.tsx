import SyntaxHighlighterPkg from "react-syntax-highlighter";
import { useState } from "react";
import { Table as TableIcon } from "lucide-react";

const { Light: SyntaxHighlighter } = SyntaxHighlighterPkg as any;

import type { ImportOption } from "./types";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Switch } from "~/components/form/switch";
import { Label } from "~/components/form/label";
import {
  createFileInput,
  createSwitchInput,
  createTextInput,
} from "~/features/visualizer/inputs";

const validateNodes = async (file: File | undefined) => {
  if (!file)
    return {
      success: false,
      message: "Unable to read file content. Please try again.",
    };

  try {
    const text = await file.text();
    const lines = text.trim().split("\n");

    // Check lines has at least two lines (one header and 1 node)
    if (lines.length < 2) {
      return {
        success: false,
        message:
          "Nodes file must have at least two lines (one header, one node)",
      };
    }

    // Check header - now supports multiple columns
    const header = lines[0].trim();
    const columns = header.split(",").map(col => col.trim());
    
    if (columns.length === 0) {
      return {
        success: false,
        message: "Nodes file must have at least one column in the header",
      };
    }

    // Check if every line has the same number of columns as header
    const expectedColumns = columns.length;
    const isValid = lines
      .slice(1)
      .every((line) => line.split(",").length === expectedColumns);

    if (!isValid) {
      return {
        success: false,
        message: `Every line should have exactly ${expectedColumns} column(s) to match the header`,
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      message: "Unable to read file content. Please try again.",
    };
  }
};

const validateEdges = async (file: File | undefined) => {
  if (!file)
    return {
      value: file,
      success: false,
      message: "Unable to read file content. Please try again.",
    };

  try {
    const text = await file.text();
    const lines = text.trim().split("\n");

    // Check header
    const header = lines[0].trim();
    if (!["source,target,weight", "source,target"].includes(header)) {
      return {
        success: false,
        message:
          "Nodes file must have 'source,target,weight' or 'source,target' as the header (first line)",
      };
    }

    // Check if every line has exactly two or three node
    const validLength = header.split(",").length;
    const isValid = lines
      .slice(1)
      .every((line) => line.split(",").length === validLength);

    if (!isValid) {
      return {
        success: false,
        message: "Number of values don't match with the header",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      message: "Unable to read file content. Please try again. ",
    };
  }
};

type CSVInputType = {};

export const ImportCSV: ImportOption = {
  label: "Import as CSV",
  value: "csv",
  icon: TableIcon,
  title: "Import CSV Files",
  description:
    "Upload your graph data by selecting two CSV files: one for nodes and one for edges. The node table name will be taken from the filename (without .csv). The first column in nodes.csv will be the primary key, and all columns will be imported as node properties. Edges.csv should have source and target columns (matching the node primary key), with optional weight column.",
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
    createSwitchInput({
      id: "directed-csv",
      key: "directed",
      displayName: "Directed Graph",
      required: true,
      defaultValue: false,
    }),
  ],
  handler: async ({ values }: { values: Record<string, any> }) => {
    const { name, nodes, edges, directed } = values;

    // Get the database name
    const databaseName = name.value as string;
    const nodesFile = nodes.value as File;
    const edgesFile = edges.value as File;
    const isDirected = directed.value as boolean;

    try {
      // Import using controller
      const { controller } = await import("~/MainController");
      // @ts-ignore - Import kuzu for file system access
      const kuzu = await import("kuzu-wasm/sync");

      console.log(`[CSV Import] Starting import for database: ${databaseName}`);

      // Read files content
      const nodesText = await nodesFile.text();
      const edgesText = await edgesFile.text();

      // Parse CSV to get structure
      const nodesLines = nodesText.trim().split("\n");
      const edgesLines = edgesText.trim().split("\n");

      // Parse node CSV header to get all columns
      const nodesHeader = nodesLines[0].trim();
      const nodeColumns = nodesHeader.split(",").map(col => col.trim());

      // Parse edge CSV header
      const edgesHeader = edgesLines[0].trim();
      const edgeColumns = edgesHeader.split(",").map(col => col.trim());
      const hasWeight = edgeColumns.includes("weight");

      // Step 1: Extract table names from filenames (without .csv extension)
      const nodeTableName = nodesFile.name.replace(/\.csv$/i, '');
      const edgeTableName = edgesFile.name.replace(/\.csv$/i, '');

      console.log(`[CSV Import] Node table name: ${nodeTableName}`);
      console.log(`[CSV Import] Edge table name: ${edgeTableName}`);

      // Step 2: Determine primary key and analyze column types
      const primaryKeyColumn = nodeColumns[0];
      const additionalProperties = nodeColumns.slice(1).map(col => ({
        name: col,
        type: "STRING" as const // We'll use STRING for all additional properties for simplicity
      }));

      console.log(`[CSV Import] Primary key: ${primaryKeyColumn}`);
      console.log(`[CSV Import] Additional properties:`, additionalProperties);

      // Create node table schema with all properties
      await controller.db.createNodeSchema(
        nodeTableName,
        primaryKeyColumn,
        "STRING",
        additionalProperties
      );

      // Step 3: Create edge table schema using CREATE REL TABLE syntax
      // This creates a proper relationship table that can be used with COPY FROM
      const edgeTableQuery = hasWeight
        ? `CREATE REL TABLE ${edgeTableName} (
            FROM ${nodeTableName} TO ${nodeTableName},
            weight DOUBLE
          )`
        : `CREATE REL TABLE ${edgeTableName} (
            FROM ${nodeTableName} TO ${nodeTableName}
          )`;

      console.log(`[CSV Import] Creating edge table with query: ${edgeTableQuery}`);
      await controller.db.executeQuery(edgeTableQuery);

      // Step 4: Write CSV files to Kuzu's virtual file system
      const fs = kuzu.default.getFS();
      const tempDir = '/tmp';

      // Ensure temp directory exists
      try {
        fs.mkdir(tempDir);
      } catch (e) {
        // Directory might already exist, ignore error
      }

      const nodesPath = `${tempDir}/nodes_${Date.now()}.csv`;
      const edgesPath = `${tempDir}/edges_${Date.now()}.csv`;

      // Write files to virtual file system
      fs.writeFile(nodesPath, nodesText);
      fs.writeFile(edgesPath, edgesText);

      // Step 5: Load nodes using LOAD WITH HEADERS for explicit type control
      // This approach provides better type safety and performance

      // Build header types for LOAD WITH HEADERS
      // For now, we use STRING for all columns, but this could be enhanced with type inference
      const headerTypes = nodeColumns.map(col => `${col} STRING`).join(', ');

      // Build property mapping for CREATE clause
      const propertyMappings = nodeColumns.map(col => `${col}: ${col}`).join(", ");

      // Use LOAD WITH HEADERS for explicit type control
      // Example: LOAD WITH HEADERS (userID STRING, name STRING, age STRING) FROM "users.csv" (header = true)
      const loadNodesQuery = `
        LOAD WITH HEADERS (${headerTypes}) FROM '${nodesPath}' (header = true)
        CREATE (:\`${nodeTableName}\` {${propertyMappings}})
      `;

      console.log(`[CSV Import] Loading nodes with LOAD WITH HEADERS: ${loadNodesQuery}`);
      await controller.db.executeQuery(loadNodesQuery);

      // Step 6: Load edges using COPY FROM for direct table loading
      // This is much more efficient than LOAD FROM + MATCH + CREATE
      // COPY FROM directly loads data into the relationship table

      if (isDirected) {
        // For directed graphs, use COPY FROM directly
        const copyEdgesQuery = `COPY ${edgeTableName} FROM '${edgesPath}' (header = true)`;

        console.log(`[CSV Import] Loading directed edges with COPY FROM: ${copyEdgesQuery}`);
        await controller.db.executeQuery(copyEdgesQuery);
      } else {
        // For undirected graphs, we need to create edges in both directions
        // First, copy the original edges
        const copyEdgesQuery1 = `COPY ${edgeTableName} FROM '${edgesPath}' (header = true)`;

        console.log(`[CSV Import] Loading undirected edges (direction 1) with COPY FROM: ${copyEdgesQuery1}`);
        await controller.db.executeQuery(copyEdgesQuery1);

        // Then create a temporary file with reversed edges for the second direction
        const reversedEdgesPath = `${tempDir}/reversed_edges_${Date.now()}.csv`;
        const reversedEdgesContent = edgesLines.map((line, index) => {
          if (index === 0) {
            // Header line - keep as is
            return line;
          }
          // Data lines - swap first two columns (source and target)
          const parts = line.split(',');
          if (parts.length >= 2) {
            [parts[0], parts[1]] = [parts[1], parts[0]]; // Swap source and target
          }
          return parts.join(',');
        }).join('\n');

        fs.writeFile(reversedEdgesPath, reversedEdgesContent);

        // Copy the reversed edges
        const copyEdgesQuery2 = `COPY ${edgeTableName} FROM '${reversedEdgesPath}' (header = true)`;

        console.log(`[CSV Import] Loading undirected edges (direction 2) with COPY FROM: ${copyEdgesQuery2}`);
        await controller.db.executeQuery(copyEdgesQuery2);

        // Clean up the temporary reversed edges file
        try {
          fs.unlink(reversedEdgesPath);
        } catch (e) {
          console.warn(`[CSV Import] Failed to clean up reversed edges file:`, e);
        }
      }

      // Step 7: Clean up temporary files
      try {
        fs.unlink(nodesPath);
        fs.unlink(edgesPath);
        // Note: reversedEdgesPath is already cleaned up in the undirected case above
      } catch (e) {
        console.warn(`[CSV Import] Failed to clean up temporary files:`, e);
      }

      // Step 8: Refresh graph state
      const graphState = await controller.db.snapshotGraphState();

      console.log(`[CSV Import] Successfully bulk-imported graph with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges using optimized COPY FROM approach`);

      return {
        success: true,
        message: `Successfully imported graph "${databaseName}" with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges!`,
        data: graphState,
      };
    } catch (error) {
      console.error("[CSV Import] Error:", error);
      return {
        success: false,
        message: `Failed to import CSV: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

function CSVPreview() {
  const [isTableView, setIsTableView] = useState(true);

  return (
    <div className="flex flex-col items-end gap-6">
      <div className="flex items-center gap-2">
        <Label htmlFor="toggle-table-view">Table View</Label>
        <Switch
          id="toggle-table-view"
          checked={isTableView}
          onCheckedChange={setIsTableView}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {isTableView ? (
          <>
            {/* Table view */}
            <Table className="max-h-56">
              <TableCaption>nodes.csv</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>node</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>John</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Michael</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sarah</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tina</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Table className="max-h-56">
              <TableCaption>edges.csv</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>source</TableHead>
                  <TableHead>target</TableHead>
                  <TableHead>weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>John</TableCell>
                  <TableCell>Michael</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>John</TableCell>
                  <TableCell>Sarah</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sarah</TableCell>
                  <TableCell>Tina</TableCell>
                  <TableCell>2</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sarah</TableCell>
                  <TableCell>Michael</TableCell>
                  <TableCell>2</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        ) : (
          <>
            {/* Syntax highlighted code block */}
            <div className="flex flex-col items-center w-full">
              <SyntaxHighlighter
                language="csv"
                customStyle={{
                  width: "100%",
                  padding: "1rem",
                  background: "transparent",
                }}
              >
                {["node", "John", "Michael", "Sarah", "Tina"].join("\n")}
              </SyntaxHighlighter>
              <p className="text-typography-primary mt-4 small-body">
                nodes.csv
              </p>
            </div>
            <div className="flex flex-col items-center w-full">
              <SyntaxHighlighter
                language="csv"
                customStyle={{
                  width: "100%",
                  padding: "1rem",
                  background: "transparent",
                }}
              >
                {[
                  "source,target,weight",
                  "John,Michael,1",
                  "John,Sarah,1",
                  "Sarah,Tina,2",
                  "Sarah,Michael,2",
                ].join("\n")}
              </SyntaxHighlighter>
              <p className="text-typography-primary mt-4 small-body">
                edges.csv
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

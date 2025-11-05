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

    const trimmedDatabaseName = (databaseName || "").trim();
    if (!trimmedDatabaseName) {
      throw new Error("Please provide a name for the new database.");
    }

    const { controller } = await import("~/MainController");
    const previousDatabaseName = await controller.db
      .getCurrentDatabaseName()
      .catch(() => null);
    let createdDatabase = false;

    try {
      console.log(
        `[CSV Import] Starting import for database: ${trimmedDatabaseName}`
      );

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

      const createResult = await controller.db.createDatabase(
        trimmedDatabaseName
      );
      if (!createResult.success) {
        throw new Error(
          createResult.error ||
            createResult.message ||
            `Failed to create database "${trimmedDatabaseName}"`
        );
      }
      createdDatabase = true;

      const connectResult = await controller.db.connectToDatabase(
        trimmedDatabaseName
      );
      if (!connectResult.success) {
        throw new Error(
          connectResult.error ||
            connectResult.message ||
            `Failed to connect to database "${trimmedDatabaseName}"`
        );
      }

      // Step 2: Write CSV files to Kuzu's virtual file system first
      // We need the files in the VFS before we can infer types
      const tempDir = '/tmp';

      const nodesPath = `${tempDir}/nodes_${Date.now()}.csv`;
      const edgesPath = `${tempDir}/edges_${Date.now()}.csv`;

      await controller.db.writeVirtualFile(nodesPath, nodesText);
      await controller.db.writeVirtualFile(edgesPath, edgesText);

      // Step 3: Infer column types by using LOAD FROM to scan the CSV
      // LOAD FROM will automatically infer types from the CSV data
      // We'll use RETURN to get the types without creating nodes yet
      const primaryKeyColumn = nodeColumns[0];
      
      console.log(`[CSV Import] Primary key: ${primaryKeyColumn}`);
      console.log(`[CSV Import] Inferring types for columns:`, nodeColumns);

      // Query to infer types - load one row and return it to see inferred types
      const typeInferenceQuery = `
        LOAD FROM '${nodesPath}' (header = true)
        RETURN ${nodeColumns.join(', ')}
        LIMIT 1
      `;

      console.log(`[CSV Import] Inferring types with query: ${typeInferenceQuery}`);
      
      // Use the getColumnTypes method from controller
      const columnTypes = await controller.db.getColumnTypes(typeInferenceQuery);
      
      // Extract column types from the query result
      const inferredTypes: Record<string, "STRING" | "INT32" | "INT16" | "INT8" | "DOUBLE" | "FLOAT" | "BOOL" | "DATE"> = {};
      
      columnTypes.forEach((kuzuType: string, index: number) => {
        const colName = nodeColumns[index];
        // Map Kuzu types to schema types
        let schemaType: "STRING" | "INT32" | "INT16" | "INT8" | "DOUBLE" | "FLOAT" | "BOOL" | "DATE" = "STRING";
        
        const typeUpper = kuzuType.toUpperCase();
        if (typeUpper.includes("INT32")) {
          schemaType = "INT32";
        } else if (typeUpper.includes("INT16")) {
          schemaType = "INT16";
        } else if (typeUpper.includes("INT8")) {
          schemaType = "INT8";
        } else if (typeUpper.includes("INT64") || typeUpper.includes("INT")) {
          // Map INT64 and generic INT to INT32 (closest available type)
          schemaType = "INT32";
        } else if (typeUpper.includes("DOUBLE")) {
          schemaType = "DOUBLE";
        } else if (typeUpper.includes("FLOAT")) {
          schemaType = "FLOAT";
        } else if (typeUpper.includes("BOOL")) {
          schemaType = "BOOL";
        } else if (typeUpper.includes("DATE")) {
          schemaType = "DATE";
        }
        
        inferredTypes[colName] = schemaType;
      });

      console.log(`[CSV Import] Inferred types:`, inferredTypes);

      // Step 4: Create node table schema with inferred types
      const primaryKeyType = inferredTypes[primaryKeyColumn] || "STRING";
      const additionalProperties = nodeColumns.slice(1).map(col => ({
        name: col,
        type: inferredTypes[col] || "STRING"
      }));

      console.log(`[CSV Import] Creating node table with primary key: ${primaryKeyColumn} (${primaryKeyType})`);
      console.log(`[CSV Import] Additional properties:`, additionalProperties);

      await controller.db.createNodeSchema(
        nodeTableName,
        primaryKeyColumn,
        primaryKeyType,
        additionalProperties
      );

      // Step 5: Load nodes using COPY FROM for direct bulk loading
      // COPY FROM directly loads data into the node table, which is much faster
      // than LOAD FROM ... CREATE (which executes CREATE for each row)
      const copyNodesQuery = `COPY ${nodeTableName} FROM '${nodesPath}' (header = true)`;

      console.log(`[CSV Import] Loading nodes with COPY FROM: ${copyNodesQuery}`);
      await controller.db.executeQuery(copyNodesQuery);

      // Step 6: Create edge table schema using CREATE REL TABLE syntax
      // Now that nodes are loaded, we can create the relationship table
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

      // Step 7: Load edges using COPY FROM for direct table loading
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

        await controller.db.writeVirtualFile(reversedEdgesPath, reversedEdgesContent);

        // Copy the reversed edges
        const copyEdgesQuery2 = `COPY ${edgeTableName} FROM '${reversedEdgesPath}' (header = true)`;

        console.log(`[CSV Import] Loading undirected edges (direction 2) with COPY FROM: ${copyEdgesQuery2}`);
        await controller.db.executeQuery(copyEdgesQuery2);

        // Clean up the temporary reversed edges file
        await controller.db.deleteVirtualFile(reversedEdgesPath);
      }

      // Step 8: Clean up temporary files
      await controller.db.deleteVirtualFile(nodesPath);
      await controller.db.deleteVirtualFile(edgesPath);
      // Note: reversedEdgesPath is already cleaned up in the undirected case above

      await controller.db.saveDatabase().catch(() => {});

      // Step 9: Refresh graph state
      const graphState = await controller.db.snapshotGraphState();

      console.log(`[CSV Import] Successfully bulk-imported graph with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges using optimized COPY FROM approach`);

      return {
        success: true,
        message: `Successfully imported graph "${trimmedDatabaseName}" with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges!`,
        databaseName: trimmedDatabaseName,
        data: {
          nodes: graphState.nodes,
          edges: graphState.edges,
          nodeTables: graphState.nodeTables,
          edgeTables: graphState.edgeTables,
          directed: isDirected,
        },
      };
    } catch (error) {
      console.error("[CSV Import] Error:", error);
      if (previousDatabaseName) {
        try {
          await controller.db.connectToDatabase(previousDatabaseName);
        } catch (reconnectError) {
          console.error(
            "[CSV Import] Failed to reconnect to previous database:",
            reconnectError
          );
        }
      }

      if (createdDatabase) {
        try {
          await controller.db.deleteDatabase(trimmedDatabaseName);
        } catch (cleanupError) {
          console.error(
            `[CSV Import] Failed to clean up database "${trimmedDatabaseName}" after error:`,
            cleanupError
          );
        }
      }

      throw error instanceof Error ? error : new Error(String(error));
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

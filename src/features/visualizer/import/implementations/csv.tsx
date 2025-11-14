import SyntaxHighlighterPkg from "react-syntax-highlighter";
import { useState } from "react";
import { Table as TableIcon } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // createSwitchInput,
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
    const columns = header.split(",").map((col) => col.trim());

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
    // Temporarily disabled - keeping logic intact with default value
    // createSwitchInput({
    //   id: "directed-csv",
    //   key: "directed",
    //   displayName: "Directed Graph",
    //   required: true,
    //   defaultValue: false,
    // }),
  ],
  handler: async ({
    values,
    controller,
  }: {
    values: Record<string, any>;
    controller: any;
  }) => {
    const { name, nodes, edges, directed } = values;

    const databaseName = name.value as string;
    const trimmedDatabaseName = (databaseName ?? "").trim();
    const nodesFile = nodes.value as File;
    const edgesFile = edges.value as File;
    const isDirected = (directed?.value as boolean) ?? true;

    if (!trimmedDatabaseName) {
      return {
        success: false,
        message: "Please provide a name for the new database.",
      };
    }

    const createResult = await controller.db.createDatabase(
      trimmedDatabaseName,
      { isDirected }
    );
    if (!createResult.success) {
      throw new Error(
        createResult.error ||
          createResult.message ||
          `Failed to create database "${trimmedDatabaseName}"`
      );
    }

    const connectResult =
      await controller.db.connectToDatabase(trimmedDatabaseName);
    if (!connectResult.success) {
      throw new Error(
        connectResult.error ||
          connectResult.message ||
          `Failed to connect to database "${trimmedDatabaseName}"`
      );
    }

    const nodesText = await nodesFile.text();
    const edgesText = await edgesFile.text();

    const nodeTableName = nodesFile.name.replace(/\.csv$/i, "");
    const edgeTableName = edgesFile.name.replace(/\.csv$/i, "");

    const result = await controller.db.importFromCSV(
      nodesText,
      edgesText,
      nodeTableName,
      edgeTableName,
      isDirected
    );

    if (result.success && result.data) {
      await controller.db.saveDatabase();
      return {
        ...result,
        databaseName: trimmedDatabaseName,
        message: `Successfully imported graph "${trimmedDatabaseName}" with ${result.data.nodes.length} nodes and ${result.data.edges.length} edges!`,
      };
    }

    return result;
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

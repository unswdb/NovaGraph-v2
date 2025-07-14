import type { ImportOption } from "./types";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Table as TableIcon } from "lucide-react";
import { Switch } from "~/components/form/switch";
import { Label } from "~/components/form/label";
import type { GraphDatabase } from "~/features/visualizer/types";

const validateNodes = async (files: File[]) => {
  const file = files[0];

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

    // Check header
    const header = lines[0].trim();
    if (header !== "node") {
      return {
        success: false,
        message: "Nodes file must have 'node' as the header (first line)",
      };
    }

    // Check if every line has exactly one node
    const isValid = lines
      .slice(1)
      .every((line) => line.split(",").length === 1);

    if (!isValid) {
      return {
        success: false,
        message: "Some lines don't have exactly one node",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: "Unable to read file content. Please try again. ",
    };
  }
};

const validateEdges = async (files: File[]) => {
  const file = files[0];

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
        message: "Some lines don't have values matched with the header",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: "Unable to read file content. Please try again. ",
    };
  }
};

const validateNames = async (value: string, databases?: GraphDatabase[]) => {
  const doesNameExist = databases
    ?.map((database) => database.label)
    .includes(value);

  if (doesNameExist) {
    return {
      success: false,
      message: "A database with this name already exists",
    };
  }

  return { success: true };
};

export const CSV: ImportOption = {
  label: "Import as CSV",
  value: "csv",
  icon: TableIcon,
  title: "Import CSV Files",
  description:
    "Upload your graph data by selecting two CSV files: one for nodes and one for edges. Each node must be listed in nodes.csv with a single column header 'node'. Each edge must be defined in edges.csv with headers 'source,target' or 'source,target,weight'.",
  previewTitle: "CSV Format Preview",
  previewDescription: "Expected format for nodes.csv and edges.csv files",
  preview: CSVPreview,
  note: "The 'weight' column in edges.csv is **optional**! Novagraph assumes the presence of 'weight' signifies a weighted graph. Edges in a directed graph have directions. Edges in an undirected graph are bi-directional.",
  inputs: [
    {
      id: "database-name-csv",
      label: "Name of the database",
      type: "text",
      required: true,
      placeholder: "Enter a name for the database...",
      validator: validateNames,
    },
    {
      id: "nodes-csv",
      label: "nodes.csv",
      type: "file",
      required: true,
      accept: ".csv",
      multiple: false,
      validator: validateNodes,
    },
    {
      id: "edges-csv",
      label: "edges.csv",
      type: "file",
      required: true,
      accept: ".csv",
      multiple: false,
      validator: validateEdges,
    },
    {
      id: "directed-csv",
      label: "Directed Graph",
      type: "switch",
      defaultValue: false,
    },
  ],
  handler: async ({ values }: { values: Record<string, any> }) => {
    return { success: true, message: "successful" };
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

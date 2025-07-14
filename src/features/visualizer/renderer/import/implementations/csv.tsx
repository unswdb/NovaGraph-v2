import { Table } from "lucide-react";
import type { ImportOption } from "./types";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { useState } from "react";
import {
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Switch } from "~/components/form/switch";
import { Label } from "~/components/form/label";

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

export const CSV: ImportOption = {
  label: "Import as CSV",
  value: "csv",
  icon: Table,
  title: "Import CSV Files",
  description:
    "Select nodes.csv and edges.csv files from your computer in the format shown in this example:",
  preview: CSVPreview,
  note: "The 'weight' column in edges.csv is **optional**! Novagraph assumes the presence of 'weight' signifies a weighted graph. Edges in a directed graph have directions. Edges in an undirected graph are bi-directional.",
  inputs: [
    {
      label: "nodes.csv",
      type: "file",
      required: true,
      accept: ".csv",
      multiple: false,
      validator: validateNodes,
    },
    {
      label: "edges.csv",
      type: "file",
      required: true,
      accept: ".csv",
      multiple: false,
      validator: validateEdges,
    },
    {
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
  const [isTableView, setIsTableView] = useState(false);

  return (
    <>
      <div className="flex justify-center w-full">
        {isTableView ? (
          <>
            {/* Table view */}
            <Table>
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
            <Table>
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
            <div className="flex flex-col justify-center">
              <SyntaxHighlighter language="csv">
                {["node", "John", "Michael", "Sarah", "Tina"].join("\n")}
              </SyntaxHighlighter>
              <p className="text-typography-secondary mt-4 small-body">
                nodes.csv
              </p>
            </div>
            <div className="flex flex-col justify-center">
              <SyntaxHighlighter language="csv">
                {[
                  "source,target,weight",
                  "John,Michael,1",
                  "John,Sarah,1",
                  "Sarah,Tina,2",
                  "Sarah,Michael,2",
                ].join("\n")}
              </SyntaxHighlighter>
              <p className="text-typography-secondary mt-4 small-body">
                nodes.csv
              </p>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="toggle-table-view"
          checked={isTableView}
          onCheckedChange={setIsTableView}
        />
        <Label htmlFor="toggle-table-view">Table View</Label>
      </div>
    </>
  );
}

import SyntaxHighlighterPkg from "react-syntax-highlighter";
import { useState } from "react";
import { FileJson } from "lucide-react";

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

const validateNodesJSON = async (file: File | undefined) => {
  if (!file)
    return {
      success: false,
      message: "Unable to read file content. Please try again.",
    };

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Check if data is an array
    if (!Array.isArray(data)) {
      return {
        success: false,
        message: "JSON file must contain an array of objects",
      };
    }

    // Check if array has at least one element
    if (data.length === 0) {
      return {
        success: false,
        message: "JSON array must have at least one node",
      };
    }

    // Check if all elements are objects
    const allObjects = data.every((item) => typeof item === "object" && item !== null);
    if (!allObjects) {
      return {
        success: false,
        message: "All elements in the JSON array must be objects",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? `Invalid JSON: ${error.message}` : "Unable to parse JSON file",
    };
  }
};

const validateEdgesJSON = async (file: File | undefined) => {
  if (!file)
    return {
      success: false,
      message: "Unable to read file content. Please try again.",
    };

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Check if data is an array
    if (!Array.isArray(data)) {
      return {
        success: false,
        message: "JSON file must contain an array of objects",
      };
    }

    // Check if array has at least one element
    if (data.length === 0) {
      return {
        success: false,
        message: "JSON array must have at least one edge",
      };
    }

    // Check if all elements are objects with 'from' and 'to' keys
    const validEdges = data.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      return "from" in item && "to" in item;
    });

    if (!validEdges) {
      return {
        success: false,
        message: "All edge objects must have 'from' and 'to' properties",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? `Invalid JSON: ${error.message}` : "Unable to parse JSON file",
    };
  }
};

type JSONInputType = {};

export const ImportJSON: ImportOption = {
  label: "Import as JSON",
  value: "json",
  icon: FileJson,
  title: "Import JSON Files",
  description:
    "Upload your graph data by selecting two JSON files: one for nodes and one for edges. The node table name will be taken from the filename (without .json). The first property in the JSON objects will be used as the primary key. For edges, 'from' and 'to' properties are required and should match the node primary key values.",
  previewTitle: "JSON Format Preview",
  previewDescription: "Expected format for nodes.json and edges.json files",
  preview: JSONPreview,
  note: "The JSON extension must be installed in Kuzu to use this feature. Edges must have 'from' and 'to' properties. Any additional properties (besides 'from' and 'to') in edges.json will be treated as edge properties. The 'weight' property is **optional**!",
  inputs: [
    createTextInput({
      id: "database-name-json",
      key: "name",
      displayName: "Name of the database",
      required: true,
      placeholder: "Enter a name for the database...",
    }),
    createFileInput({
      id: "nodes-json",
      key: "nodes",
      displayName: "nodes.json",
      required: true,
      accept: ".json",
      validator: validateNodesJSON,
    }),
    createFileInput({
      id: "edges-json",
      key: "edges",
      displayName: "edges.json",
      required: true,
      accept: ".json",
      validator: validateEdgesJSON,
    }),
    createSwitchInput({
      id: "directed-json",
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
      const { controller } = await import("~/MainController");

      console.log(
        `[JSON Import] Starting import for database: ${databaseName}`
      );

      const nodesText = await nodesFile.text();
      const edgesText = await edgesFile.text();

      const nodeTableName = nodesFile.name.replace(/\.json$/i, "");
      const edgeTableName = edgesFile.name.replace(/\.json$/i, "");

      console.log(
        `[JSON Import] Node table: ${nodeTableName}, Edge table: ${edgeTableName}`
      );

      const result = await controller.db.importFromJSON(
        nodesText,
        edgesText,
        nodeTableName,
        edgeTableName,
        isDirected
      );

      if (result.success && result.data) {
        return {
          ...result,
          message: `Successfully imported graph "${databaseName}" with ${result.data.nodes.length} nodes and ${result.data.edges.length} edges!`,
        };
      }

      return result;
    } catch (error) {
      console.error("[JSON Import] Error:", error);
      return {
        success: false,
        message: `Failed to import JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
};

function JSONPreview() {
  const [isTableView, setIsTableView] = useState(true);

  const nodesJSONExample = [
    {
      id: "p1",
      name: "John",
      age: 35,
    },
    {
      id: "p2",
      name: "Michael",
      age: 28,
    },
    {
      id: "p3",
      name: "Sarah",
      age: 32,
    },
  ];

  const edgesJSONExample = [
    {
      from: "p1",
      to: "p2",
      weight: 1,
    },
    {
      from: "p1",
      to: "p3",
      weight: 1,
    },
    {
      from: "p3",
      to: "p2",
      weight: 2,
    },
  ];

  return (
    <div className="flex flex-col items-end gap-6">
      <div className="flex items-center gap-2">
        <Label htmlFor="toggle-table-view-json">Table View</Label>
        <Switch
          id="toggle-table-view-json"
          checked={isTableView}
          onCheckedChange={setIsTableView}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {isTableView ? (
          <>
            {/* Table view */}
            <Table className="max-h-56">
              <TableCaption>nodes.json</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>id</TableHead>
                  <TableHead>name</TableHead>
                  <TableHead>age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodesJSONExample.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell>{node.id}</TableCell>
                    <TableCell>{node.name}</TableCell>
                    <TableCell>{node.age}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Table className="max-h-56">
              <TableCaption>edges.json</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>from</TableHead>
                  <TableHead>to</TableHead>
                  <TableHead>weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {edgesJSONExample.map((edge, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{edge.from}</TableCell>
                    <TableCell>{edge.to}</TableCell>
                    <TableCell>{edge.weight}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <>
            {/* Syntax highlighted code block */}
            <div className="flex flex-col items-center w-full">
              <SyntaxHighlighter
                language="json"
                customStyle={{
                  width: "100%",
                  padding: "1rem",
                  background: "transparent",
                }}
              >
                {JSON.stringify(nodesJSONExample, null, 2)}
              </SyntaxHighlighter>
              <p className="text-typography-primary mt-4 small-body">
                nodes.json
              </p>
            </div>
            <div className="flex flex-col items-center w-full">
              <SyntaxHighlighter
                language="json"
                customStyle={{
                  width: "100%",
                  padding: "1rem",
                  background: "transparent",
                }}
              >
                {JSON.stringify(edgesJSONExample, null, 2)}
              </SyntaxHighlighter>
              <p className="text-typography-primary mt-4 small-body">
                edges.json
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

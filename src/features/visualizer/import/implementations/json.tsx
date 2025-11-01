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
      // Import using controller
      const { controller } = await import("~/MainController");
      // @ts-ignore - Import kuzu for file system access
      const kuzu = await import("kuzu-wasm/sync");

      // Read files content
      const nodesText = await nodesFile.text();
      const edgesText = await edgesFile.text();

      // Parse JSON to get structure
      const nodesData = JSON.parse(nodesText);
      const edgesData = JSON.parse(edgesText);

      // Validate that we have arrays
      if (!Array.isArray(nodesData) || !Array.isArray(edgesData)) {
        throw new Error("JSON files must contain arrays");
      }

      if (nodesData.length === 0) {
        throw new Error("Nodes JSON must have at least one node");
      }

      if (edgesData.length === 0) {
        throw new Error("Edges JSON must have at least one edge");
      }

      // Get first node to determine schema
      const firstNode = nodesData[0];
      const nodeKeys = Object.keys(firstNode);
      
      if (nodeKeys.length === 0) {
        throw new Error("Node objects must have at least one property");
      }

      // First key is the primary key
      const primaryKeyColumn = nodeKeys[0];

      // Get first edge to determine edge properties
      const firstEdge = edgesData[0];
      if (!("from" in firstEdge) || !("to" in firstEdge)) {
        throw new Error("Edge objects must have 'from' and 'to' properties");
      }

      // Extract edge properties (everything except 'from' and 'to')
      const edgeProperties = Object.keys(firstEdge).filter(
        (key) => key !== "from" && key !== "to"
      );
      const hasWeight = edgeProperties.includes("weight");

      // Step 1: Extract table names from filenames (without .json extension)
      const nodeTableName = nodesFile.name.replace(/\.json$/i, '');
      const edgeTableName = edgesFile.name.replace(/\.json$/i, '');

      console.log(`[JSON Import] Node table name: ${nodeTableName}`);
      console.log(`[JSON Import] Edge table name: ${edgeTableName}`);

      // Step 2: Write JSON files to Kuzu's virtual file system
      const fs = kuzu.default.getFS();
      const tempDir = '/tmp';

      // Ensure temp directory exists
      try {
        fs.mkdir(tempDir);
      } catch (e) {
        // Directory might already exist, ignore error
      }

      const nodesPath = `${tempDir}/nodes_${Date.now()}.json`;
      const edgesPath = `${tempDir}/edges_${Date.now()}.json`;

      // Write files to virtual file system
      fs.writeFile(nodesPath, nodesText);
      fs.writeFile(edgesPath, edgesText);

      // Step 3: Install JSON extension (if not already installed)
      try {
        await controller.db.executeQuery("INSTALL json");
        await controller.db.executeQuery("LOAD EXTENSION json");
      } catch (e) {
        // Extension might already be installed, log and continue
        console.log(`[JSON Import] JSON extension installation: ${e}`);
      }

      // Step 4: Infer column types by using LOAD FROM to scan the JSON
      // Query to infer types - load one row and return it to see inferred types
      const typeInferenceQuery = `
        LOAD FROM '${nodesPath}'
        RETURN ${nodeKeys.join(', ')}
        LIMIT 1
      `;

      // Use the getColumnTypes method from controller
      const columnTypes = controller.db.getColumnTypes(typeInferenceQuery);
      
      // Extract column types from the query result
      const inferredTypes: Record<string, string> = {};
      
      columnTypes.forEach((kuzuType: string, index: number) => {
        const colName = nodeKeys[index];
        // Map Kuzu types to schema types
        let schemaType: string = "STRING";
        
        const typeUpper = kuzuType.toUpperCase();
        
        // Handle complex types (STRUCT, ARRAY, etc.)
        if (typeUpper.includes("STRUCT")) {
          schemaType = kuzuType; // Keep the full STRUCT definition
        } else if (typeUpper.includes("[]")) {
          schemaType = kuzuType; // Keep array type definition
        } else if (typeUpper.includes("INT32")) {
          schemaType = "INT32";
        } else if (typeUpper.includes("INT16")) {
          schemaType = "INT16";
        } else if (typeUpper.includes("INT8")) {
          schemaType = "INT8";
        } else if (typeUpper.includes("UINT8")) {
          schemaType = "UINT8";
        } else if (typeUpper.includes("UINT16")) {
          schemaType = "UINT16";
        } else if (typeUpper.includes("INT64") || typeUpper.includes("INT")) {
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

      // Step 5: Create node table schema with inferred types
      // For JSON, always use raw SQL CREATE NODE TABLE to support all types
      const propertyDefinitions = nodeKeys.map(col => {
        return `${col} ${inferredTypes[col]}`;
      }).join(', ');
      
      const createNodeTableQuery = `
        CREATE NODE TABLE ${nodeTableName} (
          ${propertyDefinitions},
          PRIMARY KEY(${primaryKeyColumn})
        )
      `;

      await controller.db.executeQuery(createNodeTableQuery);

      // Step 6: Load nodes using COPY FROM
      const copyNodesQuery = `COPY ${nodeTableName} FROM '${nodesPath}'`;

      await controller.db.executeQuery(copyNodesQuery);

      // Step 7: Create edge table schema using CREATE REL TABLE syntax
      let edgeTableQuery: string;
      
      if (edgeProperties.length > 0) {
        // Build properties string for edges
        const edgePropsDefinition = edgeProperties.map(prop => {
          // For edge properties, try to infer type from first edge
          const value = firstEdge[prop];
          let propType = "STRING";
          
          if (typeof value === "number") {
            propType = Number.isInteger(value) ? "INT32" : "DOUBLE";
          } else if (typeof value === "boolean") {
            propType = "BOOL";
          }
          
          return `${prop} ${propType}`;
        }).join(', ');
        
        edgeTableQuery = `CREATE REL TABLE ${edgeTableName} (
          FROM ${nodeTableName} TO ${nodeTableName},
          ${edgePropsDefinition}
        )`;
      } else {
        edgeTableQuery = `CREATE REL TABLE ${edgeTableName} (
          FROM ${nodeTableName} TO ${nodeTableName}
        )`;
      }

      await controller.db.executeQuery(edgeTableQuery);

      // Step 8: Load edges using COPY FROM
      if (isDirected) {
        // For directed graphs, use COPY FROM directly
        const copyEdgesQuery = `COPY ${edgeTableName} FROM '${edgesPath}'`;

        await controller.db.executeQuery(copyEdgesQuery);
      } else {
        // For undirected graphs, we need to create edges in both directions
        // First, copy the original edges
        const copyEdgesQuery1 = `COPY ${edgeTableName} FROM '${edgesPath}'`;
        await controller.db.executeQuery(copyEdgesQuery1);

        // Then create a temporary file with reversed edges
        const reversedEdgesPath = `${tempDir}/reversed_edges_${Date.now()}.json`;
        const reversedEdgesData = edgesData.map((edge: any) => {
          return {
            from: edge.to,
            to: edge.from,
            ...Object.fromEntries(
              Object.entries(edge).filter(([key]) => key !== "from" && key !== "to")
            ),
          };
        });

        fs.writeFile(reversedEdgesPath, JSON.stringify(reversedEdgesData));

        // Copy the reversed edges
        const copyEdgesQuery2 = `COPY ${edgeTableName} FROM '${reversedEdgesPath}'`;
        await controller.db.executeQuery(copyEdgesQuery2);

        // Clean up the temporary reversed edges file
        try {
          fs.unlink(reversedEdgesPath);
        } catch (e) {
          console.warn(`[JSON Import] Failed to clean up reversed edges file:`, e);
        }
      }

      // Step 9: Clean up temporary files
      try {
        fs.unlink(nodesPath);
        fs.unlink(edgesPath);
      } catch (e) {
        console.warn(`[JSON Import] Failed to clean up temporary files:`, e);
      }

      // Step 10: Refresh graph state
      const graphState = await controller.db.snapshotGraphState();

      console.log(`[JSON Import] Successfully imported graph with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges`);

      return {
        success: true,
        message: `Successfully imported graph "${databaseName}" with ${graphState.nodes.length} nodes and ${graphState.edges.length} edges!`,
        data: graphState,
      };
    } catch (error) {
      console.error("[JSON Import] Error:", error);
      return {
        success: false,
        message: `Failed to import JSON: ${error instanceof Error ? error.message : String(error)}`,
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


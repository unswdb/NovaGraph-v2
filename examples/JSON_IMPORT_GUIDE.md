# JSON Import Guide for NovaGraph

This guide explains how to use the JSON import feature in NovaGraph to import graph data from JSON files.

## Overview

The JSON import feature allows you to import graph data directly from JSON files using Kuzu's `COPY FROM` command. This is similar to CSV import but supports more complex data types like nested structures and arrays.

## Requirements

- The JSON extension must be installed in Kuzu (the import handler will automatically attempt to install it)
- JSON files must be properly formatted arrays of objects

## File Format

### Nodes File (nodes.json)

The nodes file should be a JSON array where each object represents a node. The **first property** in each object will be used as the **primary key**.

**Example:**

```json
[
  {
    "p_id": "p1",
    "name": "Gregory",
    "age": 35,
    "height": 1.81
  },
  {
    "p_id": "p2",
    "name": "Alicia",
    "age": 28,
    "height": 1.65
  },
  {
    "p_id": "p3",
    "name": "Rebecca",
    "age": 42,
    "height": 1.70
  }
]
```

In this example:
- `p_id` is the primary key (first property)
- All other properties (`name`, `age`, `height`) become node properties
- Types are automatically inferred from the data

### Edges File (edges.json)

The edges file should be a JSON array where each object represents an edge. Each object **must have** `from` and `to` properties that match the node primary key values.

**Example:**

```json
[
  {
    "from": "p1",
    "to": "p2",
    "since": 2019
  },
  {
    "from": "p1",
    "to": "p3",
    "since": 2020
  },
  {
    "from": "p2",
    "to": "p3",
    "since": 2018
  }
]
```

In this example:
- `from` and `to` are required and reference node primary keys
- `since` is an optional edge property
- Any property besides `from` and `to` becomes an edge property

## Advanced Features

### Complex Data Types

JSON import supports complex Kuzu data types like STRUCT and arrays:

```json
[
  {
    "p_id": "p1",
    "name": "Gregory",
    "info": {
      "height": 1.81,
      "weight": 75.5,
      "age": 35
    },
    "tags": ["friend", "colleague"]
  }
]
```

### Directed vs Undirected Graphs

- **Directed Graph**: Edges go in one direction only (from → to)
- **Undirected Graph**: Edges are bidirectional (both from → to and to → from)

The import handler automatically creates bidirectional edges for undirected graphs.

## Usage in NovaGraph

1. Click on the import button in NovaGraph
2. Select "Import as JSON" from the dropdown
3. Enter a name for your database
4. Upload your nodes.json file
5. Upload your edges.json file
6. Choose whether the graph is directed or undirected
7. Click "Import"

## Table Naming

- Node table name: Taken from the nodes filename (without .json extension)
- Edge table name: Taken from the edges filename (without .json extension)

For example:
- `people.json` → creates table named `people`
- `friendships.json` → creates table named `friendships`

## Type Inference

The import handler automatically infers data types from your JSON:

- Numbers → INT32, DOUBLE, or FLOAT
- Strings → STRING
- Booleans → BOOL
- Objects → STRUCT
- Arrays → Array types (e.g., INT32[], STRING[])

## Error Handling

The import will fail if:
- JSON files are not valid JSON
- Nodes array is empty
- Edges array is empty
- Edge objects don't have `from` and `to` properties
- Referenced node IDs in edges don't exist in nodes

## Example Files

See the example files in this directory:
- `nodes.json` - Sample nodes file
- `edges.json` - Sample edges file

These files can be used directly to test the JSON import feature.

## Technical Details

Under the hood, the JSON import:
1. Validates JSON structure
2. Writes files to Kuzu's virtual file system
3. Installs and loads the JSON extension
4. Infers column types using `LOAD FROM` query
5. Creates node table with inferred schema
6. Uses `COPY FROM` for bulk loading nodes
7. Creates relationship table
8. Uses `COPY FROM` for bulk loading edges
9. For undirected graphs, creates reversed edges automatically

This approach is highly efficient and leverages Kuzu's native JSON support for optimal performance.


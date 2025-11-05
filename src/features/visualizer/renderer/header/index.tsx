import { observer } from "mobx-react-lite";

import type { GraphNode } from "../../types";
import ImportDropdown from "../../import/import-dropdown";
import { useStore } from "../../hooks/use-store";

import GraphRendererSearch from "./search";
import CreateNode from "./create-node";

export type Accessor = { label: string; accessor: (n: GraphNode) => string };

const GraphRendererHeader = observer(
  ({ onSelectNode }: { onSelectNode: (n: GraphNode | null) => void }) => {
    const { database, databases, switchDatabase, deleteDatabase } = useStore();
    const { nodes } = database.graph;

    const accessors: Accessor[] = [
      {
        label: "Label",
        accessor: (n: GraphNode) => String(n._primaryKeyValue),
      },
    ];

    return (
      <div className="flex justify-between items-start h-fit w-full absolute inset-0">
        {/* Import */}
        <div className="ml-4 mt-4 flex-1 flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap">Database:</span>
          <ImportDropdown
            database={database}
            databases={databases}
            onSelectDatabase={switchDatabase}
            onDeleteDatabase={deleteDatabase}
            className="flex-1 max-w-[200px]"
          />
          <CreateNode
            nodes={database.graph.nodes}
            nodeTables={database.graph.nodeTables}
            nodeTablesMap={database.graph.nodeTablesMap}
          />
        </div>
        <div className="flex-1 flex justify-end items-center mr-4 h-18">
          {/* Search */}
          {nodes.length > 0 && (
            <GraphRendererSearch
              nodes={nodes}
              accessors={accessors}
              onSelect={(n) => onSelectNode(n)}
              className="p-4 rounded-md h-max"
            />
          )}
        </div>
      </div>
    );
  }
);

export default GraphRendererHeader;

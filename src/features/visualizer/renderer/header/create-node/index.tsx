import { Plus } from "lucide-react";
import { useState } from "react";

import CreateNodeDialog from "./create-node-dialog";
import CreateNodeSchemaDialog from "./create-node-schema-dialog";

import type { GraphNode, NodeSchema } from "~/features/visualizer/types";

import { Button } from "~/components/ui/button";
import { isNonEmpty } from "~/lib/utils";

export default function CreateNode({
  nodes,
  nodeTables,
  nodeTablesMap,
}: {
  nodes: GraphNode[];
  nodeTables: NodeSchema[];
  nodeTablesMap: Map<string, NodeSchema>;
}) {
  const [dialogStatus, setDialogStatus] = useState({
    createNode: false,
    createNodeSchema: false,
  });

  const onCloseCreateNode = () => {
    setDialogStatus({ createNode: false, createNodeSchema: false });
  };

  const onCreateSchemaClickCreateNode = () => {
    setDialogStatus((prev) => ({
      createNode: !prev.createNode,
      createNodeSchema: true,
    }));
  };

  const onSubmitCreateNodeSchema = () => {
    if (dialogStatus.createNodeSchema) {
      setDialogStatus({ createNode: true, createNodeSchema: false });
    }
  };

  const setCreateNodeSchemaOpen = (open: boolean) => {
    if (!isNonEmpty(nodeTables)) {
      setDialogStatus({ createNode: false, createNodeSchema: open });
    } else {
      setDialogStatus({ createNode: !open, createNodeSchema: open });
    }
  };

  const openDialog = () => {
    if (!isNonEmpty(nodeTables)) {
      setDialogStatus({ createNode: false, createNodeSchema: true });
    } else {
      setDialogStatus({ createNode: true, createNodeSchema: false });
    }
  };

  return (
    <>
      <Button title="Create Node" variant="outline" onClick={openDialog}>
        <Plus /> Node
      </Button>
      <CreateNodeSchemaDialog
        open={dialogStatus.createNodeSchema}
        setOpen={setCreateNodeSchemaOpen}
        nodeTables={nodeTables}
        onSubmit={onSubmitCreateNodeSchema}
      />
      {isNonEmpty(nodeTables) && (
        <CreateNodeDialog
          open={dialogStatus.createNode}
          nodes={nodes}
          nodeTables={nodeTables}
          nodeTablesMap={nodeTablesMap}
          onClose={onCloseCreateNode}
          onCreateSchemaClick={onCreateSchemaClickCreateNode}
        />
      )}
    </>
  );
}

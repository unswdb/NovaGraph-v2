import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useMemo, useState } from "react";
import { useStore } from "~/features/visualizer/hooks/use-store";
import CreateNodeSchemaDialog from "./create-node-schema-dialog";
import CreateNodeDialog from "./create-node-dialog";
import { isNodeSchema, type NodeSchema } from "~/features/visualizer/types";

export type NonEmptyNodeSchemas = [NodeSchema, ...NodeSchema[]];
function isNonEmpty(arr: NodeSchema[]): arr is NonEmptyNodeSchemas {
  return arr.length > 0;
}

export default function CreateNode() {
  const { database } = useStore();

  const [dialogStatus, setDialogStatus] = useState({
    createNode: false,
    createNodeSchema: false,
  });

  const { nodeSchemas, nodeSchemasMap } = useMemo(() => {
    let nodeSchemas: NodeSchema[] = [];
    let nodeSchemasMap: Record<string, NodeSchema> = {};
    database.graph.tables.forEach((s) => {
      if (isNodeSchema(s)) {
        nodeSchemas.push(s);
        nodeSchemasMap[s.tableName] = s;
      }
    });
    return { nodeSchemas, nodeSchemasMap };
  }, [database.graph.tables]);

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
    setDialogStatus({ createNode: true, createNodeSchema: false });
  };

  const setCreateNodeSchemaOpen = (open: boolean) => {
    if (nodeSchemas.length === 0) {
      setDialogStatus({ createNode: false, createNodeSchema: open });
    } else {
      setDialogStatus({ createNode: !open, createNodeSchema: open });
    }
  };

  const openDialog = () => {
    if (nodeSchemas.length === 0) {
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
        onSubmit={onSubmitCreateNodeSchema}
        nodeSchemas={nodeSchemas}
      />
      {isNonEmpty(nodeSchemas) && (
        <CreateNodeDialog
          open={dialogStatus.createNode}
          onClose={onCloseCreateNode}
          onCreateSchemaClick={onCreateSchemaClickCreateNode}
          nodeSchemas={nodeSchemas}
          nodeSchemasMap={nodeSchemasMap}
        />
      )}
    </>
  );
}

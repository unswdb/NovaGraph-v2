import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useMemo, useState } from "react";
import { useStore } from "~/features/visualizer/hooks/use-store";
import CreateNodeSchemaDialog from "./create-node-schema";
import CreateNodeDialog from "./create-node";

export default function CreateNode() {
  const { database } = useStore();

  const [dialogStatus, setDialogStatus] = useState({
    createNode: false,
    createNodeSchema: false,
  });

  const nodeSchemas = useMemo(
    () => database.graph.tables.filter((s) => s.tableType === "NODE"),
    [database.graph.tables]
  );

  console.log("nodeSchemas", nodeSchemas);

  const setCreateNodeOpen = (open: boolean) => {
    if (nodeSchemas.length !== 0) {
      setDialogStatus({ createNode: open, createNodeSchema: !open });
    }
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
        nodeSchemas={nodeSchemas}
      />
      {nodeSchemas.length > 0 && (
        <CreateNodeDialog
          open={dialogStatus.createNode}
          setOpen={setCreateNodeOpen}
        />
      )}
    </>
  );
}

import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useMemo, useState } from "react";
import { useStore } from "~/features/visualizer/hooks/use-store";
import CreateNodeSchemaDialog from "./create-node-schema";

export default function CreateNode() {
  const { database } = useStore();

  const [dialogStatus, setDialogStatus] = useState({
    createNode: false,
    createNodeSchema: false,
  });

  const nodeSchemas = useMemo(
    () => database.graph.schema.filter((s) => s.tableType === "NODE"),
    [database.graph.schema]
  );

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
      <Button variant="outline" onClick={openDialog}>
        <Plus /> Node
      </Button>
      <CreateNodeSchemaDialog
        open={dialogStatus.createNodeSchema}
        setOpen={setCreateNodeSchemaOpen}
        nodeSchemas={nodeSchemas}
      />
      {/* <CreateNodeDialog open={dialogStatus.createNode} /> */}
    </>
  );
}
